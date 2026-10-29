import { getIndex, getIssue } from "./data";
import { findRepos, isDate, pickRange } from "./digest";
import { GitHubError, getRepo, searchRepos } from "./github";

// MCP-сервер repohelper: те же выпуски, что в API v1, плюс поиск по GitHub — как инструменты для ИИ-клиентов.
// Транспорт Streamable HTTP без сессий: каждый POST — один JSON-RPC запрос, ответ сразу JSON.

export const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS = `repohelper каждый день в 10:00 по Москве собирает трендовые репозитории GitHub: раздел ai (про ИИ) и hot (набирают звёзды), с описанием на русском.
Свежие тренды: get_issue без даты. Где и когда репозиторий был в трендах: search_digest с repo. Подобрать проекты под задачу: search_github, затем get_github_repo для README.`;

type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  run: (args: Record<string, unknown>) => Promise<unknown>;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const DATE = { type: "string", description: "YYYY-MM-DD" };

class ToolError extends Error {}

const TOOLS: Tool[] = [
  {
    name: "list_issues",
    title: "Список выпусков",
    description:
      "Выпуски repohelper за период: дата, сколько репозиториев, сколько про ИИ, лидер дня и сколько звёзд он набрал. Без дат — последние 30 выпусков. Диапазон до 90 дней.",
    inputSchema: { type: "object", properties: { from: DATE, to: DATE } },
    run: async (a) => {
      const range = pickRange(await getIndex(), { from: str(a.from), to: str(a.to) });
      if (!range.ok) throw new ToolError(range.error.message);
      return { from: range.from, to: range.to, count: range.entries.length, issues: range.entries };
    },
  },
  {
    name: "get_issue",
    title: "Выпуск за день",
    description:
      "Выпуск целиком: разделы ai и hot, у каждого репозитория описание на русском, звёзды, прирост за день, язык и темы. Без даты — последний выпуск.",
    inputSchema: { type: "object", properties: { date: { ...DATE, description: "YYYY-MM-DD, по умолчанию последний выпуск" } } },
    run: async (a) => {
      const date = str(a.date) ?? (await getIndex())[0]?.date;
      if (!date) throw new ToolError("Выпусков пока нет");
      if (!isDate(date)) throw new ToolError("date: дата в формате YYYY-MM-DD");
      const issue = await getIssue(date);
      if (!issue) throw new ToolError(`Выпуска за ${date} нет. Даты выпусков покажет list_issues.`);
      return issue;
    },
  },
  {
    name: "search_digest",
    title: "Поиск по выпускам",
    description:
      "Репозитории из выпусков repohelper за период, каждый с датой выпуска, разделом и местом. Фильтры: repo (owner/name — когда репозиторий был в трендах), q (подстрока в названии и описании), language, section ai|hot. Без дат — последние 30 выпусков.",
    inputSchema: {
      type: "object",
      properties: {
        repo: { type: "string", description: "owner/name" },
        q: { type: "string", description: "Подстрока в названии, описании или русском описании" },
        language: { type: "string", description: "Например TypeScript" },
        section: { type: "string", enum: ["ai", "hot"] },
        from: DATE,
        to: DATE,
      },
    },
    run: async (a) => {
      const found = await findRepos({
        repo: str(a.repo),
        q: str(a.q),
        language: str(a.language),
        section: str(a.section),
        from: str(a.from),
        to: str(a.to),
      });
      if (!found.ok) throw new ToolError(found.error.message);
      return { from: found.from, to: found.to, count: found.repos.length, repos: found.repos.slice(0, 50) };
    },
  },
  {
    name: "search_github",
    title: "Поиск на GitHub",
    description:
      "Поиск репозиториев по всему GitHub (не только по выпускам). Запрос — 2–5 ключевых слов на английском. Возвращает до 8 живых (не архивных) репозиториев со звёздами, языком, темами и описанием.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Ключевые слова на английском" },
        language: { type: "string", description: "Язык программирования" },
        min_stars: { type: "integer", minimum: 0, description: "Минимум звёзд, по умолчанию 20" },
      },
      required: ["query"],
    },
    run: async (a) => {
      const query = str(a.query);
      if (!query) throw new ToolError("query обязателен");
      const minStars = Number.isFinite(Number(a.min_stars)) ? Math.max(0, Number(a.min_stars)) : 20;
      const repos = await searchRepos(process.env.GITHUB_TOKEN ?? null, {
        query: query.slice(0, 200),
        language: str(a.language) ?? undefined,
        minStars,
      });
      return { count: repos.length, repos };
    },
  },
  {
    name: "get_github_repo",
    title: "Карточка репозитория",
    description: "Репозиторий owner/name с GitHub: описание, звёзды, язык, темы, дата последнего пуша и начало README.",
    inputSchema: {
      type: "object",
      properties: { full_name: { type: "string", description: "owner/name или ссылка на github.com" } },
      required: ["full_name"],
    },
    run: async (a) => {
      const raw = str(a.full_name) ?? "";
      const name = raw.replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\.git$|\/$/g, "").split("/").slice(0, 2).join("/");
      const repo = await getRepo(process.env.GITHUB_TOKEN ?? null, name);
      if (!repo) throw new ToolError(`Репозиторий ${name || raw} не найден`);
      return repo;
    },
  },
];

type JsonRpcRequest = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };
export type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: string | number | null; result: unknown }
  | { jsonrpc: "2.0"; id: string | number | null; error: { code: number; message: string } };

const ok = (id: JsonRpcRequest["id"], result: unknown): JsonRpcResponse => ({ jsonrpc: "2.0", id: id ?? null, result });
export const rpcError = (id: JsonRpcRequest["id"], code: number, message: string): JsonRpcResponse => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: { code, message },
});

/** Один JSON-RPC запрос. null — это было уведомление, отвечать не нужно. */
export async function handleRpc(msg: unknown): Promise<JsonRpcResponse | null> {
  const req = msg as JsonRpcRequest;
  if (!req || typeof req !== "object" || req.jsonrpc !== "2.0" || typeof req.method !== "string") {
    return rpcError(null, -32600, "Invalid Request");
  }
  if (req.id === undefined) return null; // notifications/initialized и прочие уведомления

  switch (req.method) {
    case "initialize": {
      const asked = String(req.params?.protocolVersion ?? "");
      return ok(req.id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "repohelper", title: "repohelper", version: "1.0.0", websiteUrl: "https://repohelper.site" },
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return ok(req.id, {});
    case "tools/list":
      return ok(req.id, {
        tools: TOOLS.map(({ name, title, description, inputSchema }) => ({
          name,
          title,
          description,
          inputSchema,
          annotations: { readOnlyHint: true, openWorldHint: name.includes("github") },
        })),
      });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === req.params?.name);
      if (!tool) return rpcError(req.id, -32602, `Нет инструмента ${String(req.params?.name)}`);
      const args = (req.params?.arguments ?? {}) as Record<string, unknown>;
      try {
        const data = await tool.run(typeof args === "object" && args ? args : {});
        return ok(req.id, { content: [{ type: "text", text: JSON.stringify(data) }], isError: false });
      } catch (e) {
        // Ошибки инструмента — в результате, чтобы модель увидела причину и поправила аргументы.
        if (e instanceof ToolError || e instanceof GitHubError) {
          return ok(req.id, { content: [{ type: "text", text: e.message }], isError: true });
        }
        throw e;
      }
    }
    case "resources/list":
      return ok(req.id, { resources: [] });
    case "prompts/list":
      return ok(req.id, { prompts: [] });
    default:
      return rpcError(req.id, -32601, `Метод ${req.method} не поддерживается`);
  }
}
