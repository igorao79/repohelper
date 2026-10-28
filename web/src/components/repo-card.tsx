import { formatCompact, formatGain, formatNumber } from "@/lib/format";
import { languageColor } from "@/lib/languages";
import type { Repo, SectionId } from "@/lib/types";

import { StarIcon } from "./icons";
import { SaveButton } from "./save-button";

type Props = {
  repo: Repo;
  rank?: number;
  section?: SectionId;
  isLead?: boolean;
  issueDate: string;
  maxGain?: number;
  index?: number; // для каскада появления
  footer?: React.ReactNode; // заменяет кнопку «отложить» (страница отложенных)
  extraTag?: React.ReactNode;
};

export function RepoCard({ repo, rank, section, isLead, issueDate, maxGain, index = 0, footer, extraTag }: Props) {
  const [owner, name] = repo.full_name.split("/");
  const momentum = maxGain ? Math.max(0.04, repo.stars_gained / maxGain) : 0;

  return (
    <article
      className={isLead ? "card repo-card is-lead" : "card repo-card"}
      style={{ "--i": Math.min(index, 12) } as React.CSSProperties}
    >
      <header className="repo-card__head">
        {/* eslint-disable-next-line @next/next/no-img-element -- аватар с GitHub, оптимизация не нужна */}
        <img
          className="avatar"
          src={`https://github.com/${owner}.png?size=80`}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          decoding="async"
        />
        <div className="repo-card__title">
          <span className="repo-card__owner">{owner}</span>
          <a className="repo-card__name stretched" href={repo.url} target="_blank" rel="noopener noreferrer">
            {name}
          </a>
        </div>
        {footer ?? (
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
      </header>

      <div className="repo-card__tags">
        {rank !== undefined && <span className="tag tag--rank">#{rank}</span>}
        {section === "ai" && <span className="tag tag--ai">ИИ</span>}
        {isLead && <span className="tag tag--lead">Лидер дня</span>}
        {extraTag}
      </div>

      <p className="repo-card__summary">{repo.summary || repo.description}</p>

      <footer className="repo-card__foot">
        <span className="lang">
          <span className="lang__dot" style={{ background: languageColor(repo.language) }} />
          {repo.language || "не указан"}
        </span>
        <span className="repo-card__stars" title={`${formatNumber(repo.stars)} звёзд`}>
          <StarIcon size={14} />
          {formatCompact(repo.stars)}
        </span>
        {repo.stars_gained > 0 && (
          <span className="gain">
            {formatGain(repo.stars_gained)}
            <span className="gain__unit">{repo.gained_label === "за день" ? "за день" : "за неделю"}</span>
          </span>
        )}
      </footer>

      {maxGain ? (
        <div className="momentum" aria-hidden="true">
          <span style={{ transform: `scaleX(${momentum})` }} />
        </div>
      ) : null}
    </article>
  );
}
