import Link from "next/link";

import { ApiKeyPanel } from "./api-key-panel";

/** Блок API на главной: что можно запросить и кнопка «Получить ключ». */
export function ApiSection() {
  return (
    <section className="apisec frame" id="api" aria-labelledby="api-title">
      <div className="apisec__copy">
        <h2 id="api-title" className="apisec__title" data-reveal>
          API выпусков
        </h2>
        <p className="apisec__lead" data-reveal>
          Выпуски по датам и поиск репозитория по всем выпускам: где и когда он попадал в тренды, сколько звёзд набрал.
          Ответы в JSON.
        </p>
        <ul className="apisec__list" data-reveal>
          <li>
            <code>GET /api/v1/issues?from=&amp;to=</code> выпуски за период
          </li>
          <li>
            <code>GET /api/v1/issues/2026-10-28</code> выпуск за день целиком
          </li>
          <li>
            <code>GET /api/v1/repos?repo=owner/name</code> появления репозитория
          </li>
          <li>
            <code>/api/mcp</code> MCP-сервер для Claude, Cursor и других ИИ
          </li>
        </ul>
        <Link className="link" href="/developers">
          Вся документация API
        </Link>
      </div>
      <ApiKeyPanel />
    </section>
  );
}
