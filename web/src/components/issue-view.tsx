import Link from "next/link";

import { issueFileUrl, issueRawUrl } from "@/lib/data";
import { formatCompact, formatDate, formatDay, formatGain, formatNumber, plural } from "@/lib/format";
import type { IndexEntry, Issue, Repo } from "@/lib/types";

import { CopyButton } from "./copy-button";
import { ArrowUpRightIcon, StarIcon } from "./icons";
import { IssueBoard } from "./issue-board";
import { RepoPreview } from "./repo-preview";

export function IssueView({ issue, index }: { issue: Issue; index: IndexEntry[] }) {
  const pos = index.findIndex((e) => e.date === issue.date);
  const number = pos >= 0 ? index.length - pos : null;
  const newer = pos > 0 ? index[pos - 1] : null;
  const older = pos >= 0 && pos < index.length - 1 ? index[pos + 1] : null;

  const repos = issue.sections.flatMap((s) => s.repos);
  const ai = issue.sections.find((s) => s.id === "ai")?.repos.length ?? 0;
  const languages = new Set(repos.map((r) => r.language).filter(Boolean)).size;
  const dayGain = repos.filter((r) => r.gained_label === "за день").reduce((sum, r) => sum + r.stars_gained, 0);
  const podium = [...repos].sort((a, b) => b.stars_gained - a.stars_gained).slice(0, 3);

  return (
    <>
      <section className="hero container">
        <div className="hero__copy">
          <p className="pill">
            <span className="pill__pulse" aria-hidden="true" />
            {number ? `Выпуск №${number}` : "Выпуск"}, {formatDate(issue.date)}
          </p>
          <h1 className="hero__title">
            Что взлетело на&nbsp;GitHub <span className="grad-text">за&nbsp;сутки</span>
          </h1>
          <p className="hero__lead">
            {repos.length} {plural(repos.length, "репозиторий", "репозитория", "репозиториев")}, которые быстрее всех
            набирают звёзды. Коротко и по-русски: описания пишет DeepSeek по README.
          </p>

          <dl className="stats">
            <div>
              <dt>звёзд за сутки</dt>
              <dd className="grad-text">{formatGain(dayGain)}</dd>
            </div>
            <div>
              <dt>про ИИ</dt>
              <dd>
                {ai}
                <small>/{repos.length}</small>
              </dd>
            </div>
            <div>
              <dt>языков</dt>
              <dd>{languages}</dd>
            </div>
          </dl>

          <div className="hero__actions">
            <a className="btn btn--primary" href="#repos">
              Смотреть выпуск
            </a>
            {older && (
              <Link className="btn btn--ghost" href={`/issue/${older.date}`} rel="prev">
                Выпуск за {formatDay(older.date)}
              </Link>
            )}
            {newer && (
              <Link className="btn btn--ghost" href={`/issue/${newer.date}`} rel="next">
                Следующий, {formatDay(newer.date)}
              </Link>
            )}
          </div>
        </div>

        <ol className="podium" aria-label="Тройка лидеров по звёздам за день">
          {podium.map((repo, i) => (
            <PodiumCard key={repo.full_name} repo={repo} place={i + 1} />
          ))}
        </ol>
      </section>

      <IssueBoard issue={issue} />

      <JsonSection issue={issue} />
    </>
  );
}

function PodiumCard({ repo, place }: { repo: Repo; place: number }) {
  const [owner, name] = repo.full_name.split("/");
  return (
    <li className={`podium__item podium__item--${place}`}>
      <a className="podium__card card" href={repo.url} target="_blank" rel="noopener noreferrer">
        <div className="podium__media">
          <RepoPreview fullName={repo.full_name} priority={place === 1} />
        </div>
        <div className="podium__body">
          <span className="podium__place" aria-label={`${place} место`}>
            {place}
          </span>
          <div className="podium__name">
            <span>{owner}/</span>
            {name}
          </div>
          <div className="podium__meta">
            <span className="gain">{formatGain(repo.stars_gained)}</span>
            <span className="podium__stars">
              <StarIcon size={13} />
              {formatCompact(repo.stars)}
            </span>
            <ArrowUpRightIcon size={16} className="podium__arrow" />
          </div>
        </div>
      </a>
    </li>
  );
}

function JsonSection({ issue }: { issue: Issue }) {
  const first = issue.sections[0]?.repos[0];
  if (!first) return null;
  const sample = {
    full_name: first.full_name,
    language: first.language,
    stars: first.stars,
    stars_gained: first.stars_gained,
    summary: first.summary,
  };
  const file = `data/issues/${issue.date}.json`;
  const total = issue.sections.flatMap((s) => s.repos).length;

  return (
    <section className="json container" aria-labelledby="json-title">
      <div className="json__copy">
        <h2 id="json-title">
          Выпуск открыт <span className="grad-text">как&nbsp;JSON</span>
        </h2>
        <p>
          Каждый выпуск бот кладёт в репозиторий. Забирайте файл в свои скрипты, ленты и ботов: в нём все {total}{" "}
          {plural(total, "репозиторий", "репозитория", "репозиториев")} с описаниями и цифрами.
        </p>
        <div className="json__actions">
          <a className="btn" href={issueFileUrl(issue.date)} target="_blank" rel="noopener noreferrer">
            Открыть на GitHub <ArrowUpRightIcon size={16} />
          </a>
          <CopyButton text={issueRawUrl(issue.date)} label="Скопировать ссылку на файл" />
        </div>
      </div>

      <figure className="code card">
        <figcaption className="code__bar">
          <span className="code__file">{file}</span>
          <span className="code__size">{formatNumber(total)} записей</span>
        </figcaption>
        <pre>
          <code>{highlightJson(JSON.stringify(sample, null, 2))}</code>
        </pre>
      </figure>
    </section>
  );
}

function highlightJson(json: string) {
  return json.split("\n").map((line, i) => {
    const m = line.match(/^(\s*)("[^"]+")(:\s)(.*)$/);
    if (!m) return <span key={i}>{line + "\n"}</span>;
    const value = m[4];
    const cls = value.startsWith('"') ? "tok-str" : "tok-num";
    return (
      <span key={i}>
        {m[1]}
        <span className="tok-key">{m[2]}</span>
        {m[3]}
        <span className={cls}>{value}</span>
        {"\n"}
      </span>
    );
  });
}
