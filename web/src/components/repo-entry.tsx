import { formatCompact, formatGain, formatNumber } from "@/lib/format";
import { languageColor } from "@/lib/languages";
import type { Repo } from "@/lib/types";

import { RepoPicture } from "./repo-picture";
import { SaveButton } from "./save-button";

type Props = {
  repo: Repo;
  issueDate: string;
  rank?: number;
  isAi?: boolean;
  aside?: React.ReactNode; // заменяет кнопку «отложить» (страница отложенных)
  note?: React.ReactNode;
};

/** Одна запись выпуска: превью репозитория от GitHub, название крупно, пересказ и цифры. */
export function RepoEntry({ repo, issueDate, rank, isAi, aside, note }: Props) {
  const [owner, name] = repo.full_name.split("/");

  return (
    <article className="entry" data-reveal>
      <a className="entry__picture" href={repo.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
        <RepoPicture fullName={repo.full_name} alt="" />
      </a>
      <div className="entry__body">
        <h3 className="entry__title">
          <a href={repo.url} target="_blank" rel="noopener noreferrer">
            <span className="entry__owner">{owner}/</span>
            <wbr />
            {name}
          </a>
        </h3>
        <p className="entry__summary">{repo.summary || repo.description}</p>
        <p className="entry__meta">
          {rank !== undefined && <span>№{rank}</span>}
          {isAi && <span>ИИ</span>}
          <span className="entry__lang">
            <span className="entry__dot" style={{ background: languageColor(repo.language) }} />
            {repo.language || "язык не указан"}
          </span>
          <span title={`${formatNumber(repo.stars)} звёзд`}>{formatCompact(repo.stars)} звёзд</span>
          {repo.stars_gained > 0 && (
            <span className="entry__gain">
              {formatGain(repo.stars_gained)} {repo.gained_label === "за день" ? "за день" : "за неделю"}
            </span>
          )}
          {note}
        </p>
      </div>
      <div className="entry__aside">
        {aside ?? (
          <SaveButton
            repo={{
              full_name: repo.full_name,
              url: repo.url,
              summary: repo.summary || repo.description,
              language: repo.language,
              stars: repo.stars,
              issue: issueDate,
            }}
          />
        )}
      </div>
    </article>
  );
}
