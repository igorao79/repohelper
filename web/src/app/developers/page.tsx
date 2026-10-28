import type { Metadata } from "next";

import { ApiKeyPanel } from "@/components/api-key-panel";

export const metadata: Metadata = {
  title: "API",
  description: "API repohelper: выпуски трендовых репозиториев GitHub по датам и поиск по репозиториям.",
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
                <code>{`curl -H "Authorization: Bearer $REPOHELPER_KEY" \\\n  "https://repohelper.site${e.example}"`}</code>
              </pre>
            </li>
          ))}
        </ol>

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
