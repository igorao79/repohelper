import Link from "next/link";

import { issueFileUrl } from "@/lib/data";
import { formatDate, formatDay, formatGain, plural } from "@/lib/format";
import type { IndexEntry, Issue } from "@/lib/types";

import { IssueLedger } from "./issue-ledger";

export function IssueView({ issue, index }: { issue: Issue; index: IndexEntry[] }) {
  const pos = index.findIndex((e) => e.date === issue.date);
  const newer = pos > 0 ? index[pos - 1] : null;
  const older = pos >= 0 && pos < index.length - 1 ? index[pos + 1] : null;

  const repos = issue.sections.flatMap((s) => s.repos);
  const ai = issue.sections.find((s) => s.id === "ai")?.repos.length ?? 0;
  const lead = repos.reduce((best, r) => (r.stars_gained > best.stars_gained ? r : best), repos[0]);

  return (
    <>
      <header className="issue-head container">
        <div className="issue-head__title">
          <h1>Выпуск за {formatDate(issue.date)}</h1>
          <p className="lead">
            {repos.length} {plural(repos.length, "репозиторий", "репозитория", "репозиториев")}, которые за сутки
            набрали больше всего звёзд на GitHub. Описания пишет DeepSeek по README.
          </p>
        </div>

        <dl className="facts">
          <div>
            <dt>Языков</dt>
            <dd className="num">{new Set(repos.map((r) => r.language).filter(Boolean)).size}</dd>
          </div>
          <div>
            <dt>Про ИИ</dt>
            <dd className="num">
              {ai} из {repos.length}
            </dd>
          </div>
          {lead && (
            <div>
              <dt>Лидер дня</dt>
              <dd>
                <a href={lead.url} target="_blank" rel="noopener noreferrer">
                  {lead.full_name.split("/")[1]}
                </a>{" "}
                <span className="num accent">{formatGain(lead.stars_gained)}</span>
              </dd>
            </div>
          )}
        </dl>

        {(older || newer) && (
          <nav className="pager" aria-label="Соседние выпуски">
            {older && (
              <Link href={`/issue/${older.date}`} rel="prev">
                Предыдущий выпуск, {formatDay(older.date)}
              </Link>
            )}
            {newer && (
              <Link href={`/issue/${newer.date}`} rel="next">
                Следующий выпуск, {formatDay(newer.date)}
              </Link>
            )}
          </nav>
        )}
      </header>

      <IssueLedger issue={issue} />

      <JsonBand issue={issue} />
    </>
  );
}

function JsonBand({ issue }: { issue: Issue }) {
  const first = issue.sections[0]?.repos[0];
  if (!first) return null;
  const sample = {
    full_name: first.full_name,
    url: first.url,
    language: first.language,
    stars: first.stars,
    stars_gained: first.stars_gained,
    summary: first.summary,
  };
  const file = `data/issues/${issue.date}.json`;

  return (
    <section className="band-ink" aria-labelledby="json-title">
      <div className="container band-ink__grid">
        <div className="band-ink__head">
          <h2 id="json-title">Тот же выпуск в JSON</h2>
          <p>Бот кладёт каждый выпуск в репозиторий. Файл можно забрать для своих скриптов, ленты или бота.</p>
          <a className="band-ink__link" href={issueFileUrl(issue.date)} target="_blank" rel="noopener noreferrer">
            Открыть {file}
          </a>
        </div>
        <figure className="band-ink__code">
          <pre>
            <code>{highlightJson(JSON.stringify(sample, null, 2))}</code>
          </pre>
          <figcaption>
            Первая запись выпуска. В файле все {issue.sections.flatMap((s) => s.repos).length} репозиториев по разделам.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function highlightJson(json: string) {
  return json.split("\n").map((line, i) => {
    const m = line.match(/^(\s*)("[^"]+")(:.*)$/);
    return (
      <span key={i}>
        {m ? (
          <>
            {m[1]}
            <span className="json-key">{m[2]}</span>
            {m[3]}
          </>
        ) : (
          line
        )}
        {"\n"}
      </span>
    );
  });
}
