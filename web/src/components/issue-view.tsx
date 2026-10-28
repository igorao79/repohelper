import { issueFileUrl } from "@/lib/urls";
import { formatCompact, formatDay, formatGain, plural } from "@/lib/format";
import type { IndexEntry, Issue, Repo } from "@/lib/types";

import { IssueBoard } from "./issue-board";
import { OpenData } from "./open-data";
import { Pipeline } from "./pipeline";
import { RepoPicture } from "./repo-picture";

export function IssueView({
  issue,
  index,
}: {
  issue: Issue;
  index: IndexEntry[];
}) {
  const repos = issue.sections.flatMap((s) => s.repos);
  const aiNames = new Set(
    issue.sections.find((s) => s.id === "ai")?.repos.map((r) => r.full_name),
  );
  const byGain = [...repos].sort((a, b) => b.stars_gained - a.stars_gained);
  const lead = byGain[0];
  const pos = index.findIndex((e) => e.date === issue.date);
  const older = pos >= 0 && pos < index.length - 1 ? index[pos + 1] : null;

  return (
    <>
      <Hero issue={issue} lead={lead} count={repos.length} />
      <IssueBoard issue={issue} />
      {lead && <Leaders repos={byGain} aiNames={aiNames} />}
      {lead && (
        <Pipeline
          repo={lead}
          date={issue.date}
          isAi={aiNames.has(lead.full_name)}
        />
      )}
      <OpenData
        sample={
          lead
            ? {
                full_name: lead.full_name,
                language: lead.language,
                stars: lead.stars,
                stars_gained: lead.stars_gained,
                summary: lead.summary,
              }
            : null
        }
        date={issue.date}
        dates={index.map((e) => e.date)}
        fileUrl={issueFileUrl(issue.date)}
        older={
          older ? { date: older.date, label: formatDay(older.date) } : null
        }
      />
    </>
  );
}

function Hero({
  issue,
  lead,
  count,
}: {
  issue: Issue;
  lead?: Repo;
  count: number;
}) {
  return (
    <section className="hero frame" aria-labelledby="hero-title">
      <h1 id="hero-title" className="hero__line">
        <span className="hero__word">Тренды</span>{" "}
        {lead && (
          <span className="hero__strip shutter">
            <RepoPicture
              fullName={lead.full_name}
              alt={`GitHub: ${lead.full_name}, лидер дня`}
              priority
            />
          </span>
        )}
        {" "}
        <span className="hero__word">дня</span>
      </h1>
      <a className="button hero__action" href="#repos">
        Открыть выпуск за {formatDay(issue.date)}
      </a>
      <p className="hero__support">
        {count === 10 ? "Десять" : count}{" "}
        {plural(count, "репозиторий", "репозитория", "репозиториев")} GitHub,
        быстрее всех набравших звёзды за сутки, и по два предложения о каждом
        по-русски.
      </p>
    </section>
  );
}

function Leaders({ repos, aiNames }: { repos: Repo[]; aiNames: Set<string> }) {
  const lead = repos[0];
  const [owner, name] = lead.full_name.split("/");

  return (
    <section className="leaders frame" aria-labelledby="leaders-title">
      <h2 id="leaders-title" className="leaders__title" data-reveal>
        Больше всех за&nbsp;сутки
      </h2>
      <div className="leaders__grid">
        <figure className="leaders__photo" data-reveal>
          {/* eslint-disable-next-line @next/next/no-img-element -- аватар автора с GitHub */}
          <img
            src={`https://github.com/${owner}.png?size=640`}
            alt={`Аватар ${owner}`}
            width={640}
            height={640}
            loading="lazy"
          />
          <figcaption>
            {owner}, автор {name}: {formatGain(lead.stars_gained)} звёзд за
            сутки, больше всех в выпуске.
          </figcaption>
        </figure>
        <p className="leaders__word" aria-hidden="true">
          звёзд за сутки
        </p>
        <ol className="leaders__table" data-reveal>
          {repos.map((r) => {
            const [o, n] = r.full_name.split("/");
            return (
              <li key={r.full_name}>
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                  <span className="leaders__kind">
                    {aiNames.has(r.full_name) ? "ИИ" : "растёт"}
                  </span>
                  <span className="leaders__name">
                    <span className="leaders__owner">{o}/</span>
                    <wbr />
                    {n}
                  </span>
                  <span className="leaders__value">
                    {formatGain(r.stars_gained)}
                    <span className="visually-hidden">
                      {" "}
                      звёзд, всего {formatCompact(r.stars)}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
