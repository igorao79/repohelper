import { getIndex, getIssue } from "./data";
import { type GhRepo, getRepo, searchRepos } from "./github";

// Студия: DeepSeek ищет репозитории инструментами, потом выбирает лучшие только из найденного.

export type StudioTurn = { role: "user" | "assistant"; text: string; repos?: string[] };
export type StudioPick = GhRepo & { reason: string; inDigest?: string };
export type StudioEvent =
  | { type: "status"; text: string }
  | { type: "result"; reply: string; repos: StudioPick[] }
  | { type: "error"; text: string };

const MODEL = () => process.env.DEEPSEEK_MODEL ?? "deepseek-flash";
const MAX_ROUNDS = 4;
const MAX_CALLS = 8; // всего вызовов инструментов за ответ

const SYSTEM = `Ты помощник Студии repohelper: подбираешь GitHub-репозитории под задачу пользователя.
Работай инструментами:
- search_github: поиск по GitHub, запросы пиши на английском, коротко (2–5 слов), при необходимости укажи language;
- get_repo: карточка репозитория и начало README — вызывай, если пользователь дал ссылку или назвал репо owner/name;
- search_digest: поиск по ежедневным выпускам repohelper (трендовые репо последних недель).
Если дали ссылку — сначала get_repo, потом 2–3 поиска похожего по его назначению, языку и темам.
Если описали задачу — сделай 2–4 разных поиска с разными формулировками.
Не придумывай репозитории. Когда кандидатов хватает, ответь одним словом «готово» без вызова инструментов.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_github",
      description: "Поиск репозиториев на GitHub. Возвращает до 8 результатов со звёздами, языком и описанием.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Ключевые слова на английском" },
          language: { type: "string", description: "Язык программирования, например TypeScript" },
          min_stars: { type: "integer", description: "Минимум звёзд, по умолчанию 20" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_repo",
      description: "Карточка репозитория owner/name: описание, язык, темы, звёзды и начало README.",
      parameters: { type: "object", properties: { full_name: { type: "string" } }, required: ["full_name"] },
    },
  },
  {
    type: "function",
    function: {
      name: "search_digest",
      description: "Поиск по выпускам repohelper за последние недели (трендовые репозитории с описаниями на русском).",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    },
  },
] as const;

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
};

async function deepseek(body: Record<string, unknown>): Promise<ChatMessage> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL(), thinking: { type: "disabled" }, temperature: 0.3, ...body }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`DeepSeek ответил ${res.status}`);
  const data = (await res.json()) as { choices: { message: ChatMessage }[] };
  return data.choices[0].message;
}

async function searchDigest(query: string): Promise<{ repo: GhRepo; date: string; summary: string }[]> {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return [];
  const index = (await getIndex()).slice(0, 30);
  const issues = await Promise.all(index.map((e) => getIssue(e.date)));
  const found = new Map<string, { repo: GhRepo; date: string; summary: string }>();
  for (const issue of issues) {
    for (const r of issue?.sections.flatMap((s) => s.repos) ?? []) {
      const text = `${r.full_name} ${r.description} ${r.summary}`.toLowerCase();
      if (!words.some((w) => text.includes(w)) || found.has(r.full_name)) continue;
      found.set(r.full_name, {
        date: issue!.date,
        summary: r.summary,
        repo: { full_name: r.full_name, url: r.url, description: r.description, stars: r.stars, language: r.language, topics: r.topics, pushed_at: "", archived: false },
      });
    }
  }
  return [...found.values()].slice(0, 8);
}

const compact = (r: GhRepo) => ({
  full_name: r.full_name,
  description: r.description.slice(0, 200),
  stars: r.stars,
  language: r.language,
  topics: r.topics.slice(0, 6),
});

export async function runStudio(turns: StudioTurn[], token: string | null, emit: (e: StudioEvent) => void): Promise<void> {
  const candidates = new Map<string, GhRepo>();
  const digestDates = new Map<string, string>();
  const history: ChatMessage[] = turns.slice(-8).map((t) => ({
    role: t.role,
    content: t.role === "assistant" && t.repos?.length ? `${t.text}\nПредложил: ${t.repos.join(", ")}` : t.text,
  }));
  const messages: ChatMessage[] = [{ role: "system", content: SYSTEM }, ...history];

  let calls = 0;
  for (let round = 0; round < MAX_ROUNDS && calls < MAX_CALLS; round++) {
    const reply = await deepseek({ messages, tools: TOOLS, max_tokens: 600 });
    messages.push({ role: "assistant", content: reply.content ?? "", tool_calls: reply.tool_calls });
    if (!reply.tool_calls?.length) break;

    for (const call of reply.tool_calls) {
      if (++calls > MAX_CALLS) {
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ error: "лимит поисков, выбирай из найденного" }) });
        continue;
      }
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {}
      let result: unknown = [];
      if (call.function.name === "search_github") {
        const query = String(args.query ?? "").slice(0, 120);
        emit({ type: "status", text: `Ищу на GitHub: «${query}»${args.language ? `, ${args.language}` : ""}` });
        const repos = await searchRepos(token, { query, language: args.language ? String(args.language) : undefined, minStars: Number(args.min_stars) || 20 });
        repos.forEach((r) => candidates.set(r.full_name, r));
        result = repos.map(compact);
      } else if (call.function.name === "get_repo") {
        const name = String(args.full_name ?? "");
        emit({ type: "status", text: `Смотрю ${name}` });
        const repo = await getRepo(token, name);
        result = repo ? { ...compact(repo), readme: repo.readme } : { error: "репозиторий не найден" };
      } else if (call.function.name === "search_digest") {
        emit({ type: "status", text: "Проверяю выпуски repohelper" });
        const hits = await searchDigest(String(args.query ?? ""));
        hits.forEach((h) => {
          candidates.set(h.repo.full_name, h.repo);
          digestDates.set(h.repo.full_name, h.date);
        });
        result = hits.map((h) => ({ ...compact(h.repo), in_digest: h.date, summary_ru: h.summary }));
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  // Исходный репозиторий из ссылки не предлагаем как «похожий» на самого себя.
  const asked = turns.at(-1)?.text.toLowerCase() ?? "";
  const pool = [...candidates.values()]
    .filter((r) => !asked.includes(r.full_name.toLowerCase()))
    .sort((a, b) => b.stars - a.stars);

  if (!pool.length) {
    emit({ type: "result", reply: "Ничего подходящего не нашёл. Попробуйте описать задачу иначе или дайте ссылку на похожий репозиторий.", repos: [] });
    return;
  }

  emit({ type: "status", text: "Выбираю лучшее" });
  const final = await deepseek({
    response_format: { type: "json_object" },
    max_tokens: 900,
    messages: [
      {
        role: "system",
        content:
          'Выбери из кандидатов 3–6 репозиториев, которые лучше всего отвечают на запрос. Сначала самые известные и зрелые проекты (больше звёзд), если они подходят по смыслу, потом нишевые. Кандидаты отсортированы по звёздам. Верни JSON {"reply": "1–2 предложения по-русски: что подобрал", "repos": [{"full_name": "...", "reason": "одно предложение по-русски, чем подходит"}]}. Только full_name из списка кандидатов.',
      },
      ...history,
      { role: "user", content: `Кандидаты:\n${JSON.stringify(pool.slice(0, 40).map(compact))}` },
    ],
  });

  let parsed: { reply?: string; repos?: { full_name?: string; reason?: string }[] } = {};
  try {
    parsed = JSON.parse(final.content ?? "{}");
  } catch {}
  const byName = new Map(pool.map((r) => [r.full_name.toLowerCase(), r]));
  const picks: StudioPick[] = [];
  for (const p of parsed.repos ?? []) {
    const repo = p.full_name ? byName.get(p.full_name.toLowerCase()) : undefined;
    if (!repo || picks.some((x) => x.full_name === repo.full_name)) continue;
    picks.push({ ...repo, reason: String(p.reason ?? ""), inDigest: digestDates.get(repo.full_name) });
  }
  emit({ type: "result", reply: String(parsed.reply ?? "Вот что нашёл."), repos: picks.slice(0, 6) });
}
