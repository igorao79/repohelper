"use client";

import { useState } from "react";

import { formatDay, formatGain, formatNumber } from "@/lib/format";
import { languageColor } from "@/lib/languages";
import type { Repo } from "@/lib/types";

const STAGES = [
  { name: "Trending", clause: "Бот смотрит Trending" },
  { name: "README", clause: "Читает README" },
  { name: "DeepSeek", clause: "DeepSeek пересказывает" },
  { name: "Telegram", clause: "В 10:00 готово" },
];

/** Как делается выпуск: ползунок на четыре шага, справа настоящий фрагмент для лидера дня. */
export function Pipeline({ repo, date, isAi }: { repo: Repo; date: string; isAi: boolean }) {
  const [stage, setStage] = useState(0);
  const [owner, name] = repo.full_name.split("/");
  const summary = repo.summary || repo.description;

  return (
    <section className="pipeline" aria-labelledby="pipeline-title">
      <div className="pipeline__clause">
        <h2 id="pipeline-title" key={stage} className="pipeline__title">
          {STAGES[stage].clause}
        </h2>
      </div>

      <div className="pipeline__stage" data-ui>
        <div className="fragment" key={stage}>
          {stage === 0 && (
            <div className="fragment__trending">
              <p className="fragment__label">github.com/trending, за сегодня</p>
              <p className="fragment__repo">
                {owner} / <b>{name}</b>
              </p>
              <p className="fragment__desc" lang="en">
                {repo.description || "No description provided."}
              </p>
              <p className="fragment__row">
                <span className="entry__lang">
                  <span className="entry__dot" style={{ background: languageColor(repo.language) }} />
                  {repo.language || "—"}
                </span>
                <span>{formatNumber(repo.stars)} stars</span>
                <span className="entry__gain">{formatNumber(repo.stars_gained)} stars today</span>
              </p>
            </div>
          )}
          {stage === 1 && (
            <div className="fragment__readme">
              <p className="fragment__label">README.md</p>
              <p className="fragment__repo">
                <b>{name}</b>
              </p>
              <p className="fragment__desc" lang="en">
                {repo.description || "No description provided."}
              </p>
              <p className="fragment__label">Бот берёт описание и первые 6000 символов README.</p>
            </div>
          )}
          {stage === 2 && (
            <div className="fragment__deepseek">
              <p className="fragment__label">deepseek-flash, без рассуждений, ответ в JSON</p>
              <p className="fragment__summary">{summary}</p>
              <p className="fragment__label">is_ai: {isAi ? "true, раздел «ИИ»" : "false, раздел «Набирают популярность»"}</p>
            </div>
          )}
          {stage === 3 && (
            <div className="fragment__telegram">
              <p className="fragment__label">Группа «git repos», {formatDay(date)}, 10:00</p>
              <p className="fragment__message">
                <b>Репозитории дня, {formatDay(date)}</b>
                <br />
                <br />
                <a href={repo.url} target="_blank" rel="noopener noreferrer">
                  {repo.full_name}
                </a>
                <br />
                {formatNumber(repo.stars)} звёзд ({formatGain(repo.stars_gained)} {repo.gained_label}), {repo.language}
                <br />
                {summary}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pipeline__control">
        <label htmlFor="pipeline-range" className="visually-hidden">
          Шаг сборки выпуска
        </label>
        <input
          id="pipeline-range"
          className="range"
          type="range"
          min={0}
          max={STAGES.length - 1}
          step={1}
          value={stage}
          onChange={(e) => setStage(Number(e.target.value))}
          aria-valuetext={STAGES[stage].name}
          style={{ "--fill": `${(stage / (STAGES.length - 1)) * 100}%` } as React.CSSProperties}
        />
        <ol className="pipeline__names">
          {STAGES.map((s, i) => (
            <li key={s.name}>
              <button type="button" aria-current={i === stage ? "step" : undefined} onClick={() => setStage(i)}>
                {s.name}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
