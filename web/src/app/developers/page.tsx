import type { Metadata } from "next";

import { ApiKeyPanel } from "@/components/api-key-panel";

export const metadata: Metadata = {
  title: "API",
  description: "API и MCP-сервер repohelper: выпуски трендовых репозиториев GitHub по датам и поиск по репозиториям.",
};

const ENDPOINTS = [
  {
    path: "GET /api/v1/issues",
    what: "Список выпусков: дата, сколько репозиториев, сколько про ИИ, лидер дня и его прирост звёзд.",
    params: "date, или from и to (YYYY-MM-DD, до 90 дней). Без параметров последние 30 выпусков.",
    example: "/api/v1/issues?from=2026-10-01&to=2026-10-31",
  },
  {
    path: "GET /api/v1/issues/{date}",
    what: "Выпуск за день целиком: разделы «ИИ» и «Набирают популярность», репозитории с описаниями на русском.",
    params: "date в пути, YYYY-MM-DD. 404, если выпуска в этот день не было.",
    example: "/api/v1/issues/2026-10-28",
  },
  {
    path: "GET /api/v1/repos",
    what: "Репозитории из выпусков за период, каждый с датой выпуска, разделом и местом.",
    params: "repo=owner/name, q (поиск по названию и описанию), language, section=ai|hot, date или from и to.",
    example: "/api/v1/repos?repo=NVIDIA/SkillSpector&from=2026-10-01&to=2026-10-31",
  },
];

const MCP_TOOLS = [
  ["list_issues", "выпуски за период"],
  ["get_issue", "выпуск за день, без даты последний"],
  ["search_digest", "репозитории из выпусков: по repo, q, language, section"],
  ["search_github", "поиск по всему GitHub"],
  ["get_github_repo", "карточка репозитория и начало README"],
];

const MCP_CLIENTS = [
  {
    name: "Claude Code",
    code: `claude mcp add --transport http repohelper https://www.repohelper.site/api/mcp \\\n  --header "Authorization: Bearer $REPOHELPER_KEY"`,
  },
  {
    name: "Cursor, Windsurf, VS Code и другие с mcp.json",
    code: `{\n  "mcpServers": {\n    "repohelper": {\n      "url": "https://www.repohelper.site/api/mcp",\n      "headers": { "Authorization": "Bearer rh_ваш_ключ" }\n    }\n  }\n}`,
  },
  {
    name: "Claude, ChatGPT и клиенты без заголовков",
    code: "https://www.repohelper.site/api/mcp?key=rh_ваш_ключ",
    note: "Добавьте как свой коннектор по адресу. Ключ в адресе виден в истории и логах, поэтому для таких клиентов лучше выпустить отдельный.",
  },
];

export default function DevelopersPage() {
  return (
    <section className="docs frame" aria-labelledby="docs-title">
      <div className="docs__side">
        <h1 id="docs-title" className="docs__title">
          API repohelper
        </h1>
        <p className="docs__lead">
          Те же выпуски, что на сайте и в Telegram, в JSON. Ключ передаётся в заголовке{" "}
          <code>Authorization: Bearer rh_…</code> или <code>X-API-Key</code>.
        </p>
        <div className="docs__key" id="api">
          <ApiKeyPanel />
        </div>
      </div>

      <div className="docs__main">
        <h2 className="docs__h2">Запросы</h2>
        <ol className="docs__endpoints">
          {ENDPOINTS.map((e) => (
            <li key={e.path}>
              <h3 className="docs__path">
                <code>{e.path}</code>
              </h3>
              <p>{e.what}</p>
              <p className="docs__params">Параметры: {e.params}</p>
              <pre>
                <code>{`curl -H "Authorization: Bearer $REPOHELPER_KEY" \\\n  "https://www.repohelper.site${e.example}"`}</code>
              </pre>
            </li>
          ))}
        </ol>

        <h2 className="docs__h2" id="mcp">
          MCP
        </h2>
        <p className="docs__lead">
          Выпуски и поиск по GitHub как инструменты для ИИ: Claude, Cursor и любой клиент с поддержкой MCP сам ищет
          репозитории и смотрит тренды, пока решает вашу задачу. Сервер <code>https://www.repohelper.site/api/mcp</code>{" "}
          (Streamable HTTP), ключ тот же, что для API.
        </p>
        <ol className="docs__endpoints">
          {MCP_CLIENTS.map((c) => (
            <li key={c.name}>
              <h3 className="docs__path">{c.name}</h3>
              <pre>
                <code>{c.code}</code>
              </pre>
              {c.note && <p className="docs__params">{c.note}</p>}
            </li>
          ))}
        </ol>
        <p className="docs__lead">
          Инструменты:{" "}
          {MCP_TOOLS.map(([name, what], i) => (
            <span key={name}>
              <code>{name}</code> {what}
              {i < MCP_TOOLS.length - 1 ? "; " : "."}
            </span>
          ))}
        </p>

        <h2 className="docs__h2">Ошибки</h2>
        <p className="docs__lead">
          Ответ с ошибкой выглядит так: <code>{`{"error":{"code":"invalid_key","message":"…"}}`}</code>. Коды: 400 неверная
          дата или параметр, 401 нет ключа или он неверный, 404 выпуска нет. Данные обновляются каждый день в 10:00 по
          Москве.
        </p>
      </div>
    </section>
  );
}
