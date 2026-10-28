import { issueFileUrl } from "@/lib/urls";
import { formatCompact, formatDay, plural } from "@/lib/format";
import type { IndexEntry, Issue, Repo } from "@/lib/types";

import { ApiSection } from "./api-section";
import { GainBoard } from "./gain-board";
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
      <ApiSection />
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
  return (
    <section className="leaders frame" aria-labelledby="leaders-title">
      <div className="leaders__head">
        <h2 id="leaders-title" className="leaders__title" data-reveal>
          Больше всех за&nbsp;сутки
        </h2>
        <p className="leaders__lead" data-reveal>
          Полоса — сколько звёзд репозиторий набрал за день относительно лидера.
        </p>
      </div>
      <GainBoard
        label="Прирост звёзд за сутки"
        rows={repos.map((r) => {
          const [o, n] = r.full_name.split("/");
          return {
            key: r.full_name,
            href: r.url,
            external: true,
            avatar: o,
            title: (
              <>
                <span className="board__owner">{o}/</span>
                <wbr />
                {n}
              </>
            ),
            note: `${aiNames.has(r.full_name) ? "ИИ" : "набирает популярность"}, ${formatCompact(r.stars)} звёзд`,
            value: r.stars_gained,
          };
        })}
      />
    </section>
  );
}
