"use client";

import { useEffect, useMemo } from "react";

import { languageColor } from "@/lib/languages";
import type { Issue, Repo, SectionId } from "@/lib/types";
import { type Filters, type SectionFilter, defaultFilters } from "@/stores/app-store";
import { useAppStore, useAppStoreApi } from "@/stores/app-store-provider";

import { SearchIcon } from "./icons";
import { RepoCard } from "./repo-card";
import { useSpotlight } from "./use-spotlight";

type Row = Repo & { rank: number; section: SectionId };

const SECTIONS: { id: SectionFilter; label: string; short: string }[] = [
  { id: "all", label: "Все", short: "Все" },
  { id: "ai", label: "ИИ", short: "ИИ" },
  { id: "hot", label: "Набирают популярность", short: "Растут" },
];

/** Фильтры живут в Zustand и зеркалятся в адресную строку, чтобы ссылкой можно было поделиться. */
function useFiltersInUrl() {
  const store = useAppStoreApi();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    store.getState().setFilters({
      section: section === "ai" || section === "hot" ? section : "all",
      language: params.get("lang") ?? "",
      query: params.get("q") ?? "",
      onlySaved: params.has("saved"),
    });

    return store.subscribe((state, prev) => {
      if (
        state.section === prev.section &&
        state.language === prev.language &&
        state.query === prev.query &&
        state.onlySaved === prev.onlySaved
      )
        return;
      const next = new URLSearchParams();
      if (state.section !== "all") next.set("section", state.section);
      if (state.language) next.set("lang", state.language);
      if (state.query) next.set("q", state.query);
      if (state.onlySaved) next.set("saved", "1");
      const qs = next.toString();
      window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    });
  }, [store]);
}

function matches(row: Row, f: Filters, saved: Record<string, unknown>): boolean {
  if (f.section !== "all" && row.section !== f.section) return false;
  if (f.language && row.language !== f.language) return false;
  if (f.onlySaved && !saved[row.full_name]) return false;
  const q = f.query.trim().toLowerCase();
  if (q && ![row.full_name, row.description, row.summary].some((t) => t.toLowerCase().includes(q))) return false;
  return true;
}

export function IssueBoard({ issue }: { issue: Issue }) {
  useFiltersInUrl();
  const spotlight = useSpotlight();

  const section = useAppStore((s) => s.section);
  const language = useAppStore((s) => s.language);
  const query = useAppStore((s) => s.query);
  const onlySaved = useAppStore((s) => s.onlySaved);
  const saved = useAppStore((s) => s.saved);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);

  const rows = useMemo<Row[]>(() => {
    let rank = 0;
    return issue.sections.flatMap((s) => s.repos.map((r) => ({ ...r, rank: ++rank, section: s.id })));
  }, [issue]);

  const maxGain = Math.max(...rows.map((r) => r.stars_gained), 1);
  const leadName = rows.find((r) => r.stars_gained === maxGain)?.full_name;
  const languages = useMemo(() => [...new Set(rows.map((r) => r.language).filter(Boolean))].sort(), [rows]);
  const counts: Record<SectionFilter, number> = {
    all: rows.length,
    ai: rows.filter((r) => r.section === "ai").length,
    hot: rows.filter((r) => r.section === "hot").length,
  };

  const filters = { section, language, query, onlySaved };
  const visible = rows.filter((r) => matches(r, filters, saved));
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(defaultFilters);
  const activeIndex = SECTIONS.findIndex((s) => s.id === section);

  return (
    <section className="board container" id="repos" aria-labelledby="board-title">
      <div className="board__head">
        <h2 id="board-title">Все репозитории выпуска</h2>
        <p className="board__count" role="status">
          {isFiltered ? `Показано ${visible.length} из ${rows.length}` : `${rows.length} в выпуске`}
        </p>
      </div>

      <div className="filters">
        <div
          className="tabs"
          role="group"
          aria-label="Раздел"
          style={{ "--active": activeIndex, "--count": SECTIONS.length } as React.CSSProperties}
        >
          <span className="tabs__indicator" aria-hidden="true" />
          {SECTIONS.map(({ id, label, short }) => (
            <button
              key={id}
              type="button"
              aria-pressed={section === id}
              onClick={() => setFilters({ section: id })}
              disabled={id !== "all" && counts[id] === 0}
            >
              <span className="tabs__label">{label}</span>
              <span className="tabs__short">{short}</span>
              <span className="tabs__count">{counts[id]}</span>
            </button>
          ))}
        </div>

        <label className="search">
          <SearchIcon />
          <span className="visually-hidden">Поиск по выпуску</span>
          <input
            type="search"
            name="q"
            autoComplete="off"
            placeholder="Найти по названию или описанию"
            value={query}
            onChange={(e) => setFilters({ query: e.target.value })}
          />
        </label>

        <div className="chips" role="group" aria-label="Язык">
          <button type="button" className="chip" aria-pressed={language === ""} onClick={() => setFilters({ language: "" })}>
            Все языки
          </button>
          {languages.map((l) => (
            <button
              key={l}
              type="button"
              className="chip"
              aria-pressed={language === l}
              onClick={() => setFilters({ language: language === l ? "" : l })}
            >
              <span className="lang__dot" style={{ background: languageColor(l) }} />
              {l}
            </button>
          ))}
          <button
            type="button"
            className="chip chip--saved"
            aria-pressed={onlySaved}
            onClick={() => setFilters({ onlySaved: !onlySaved })}
          >
            Только отложенные
          </button>
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="grid" {...spotlight}>
          {visible.map((r, i) => (
            <RepoCard
              key={r.full_name}
              repo={r}
              rank={r.rank}
              section={r.section}
              isLead={r.full_name === leadName}
              issueDate={issue.date}
              maxGain={maxGain}
              index={i}
            />
          ))}
        </div>
      ) : (
        <div className="empty card">
          <p className="empty__title">
            {onlySaved && !Object.keys(saved).length ? "Отложенных пока нет" : "Ничего не нашлось"}
          </p>
          <p>
            {onlySaved && !Object.keys(saved).length
              ? "Нажмите на закладку в карточке, чтобы вернуться к репозиторию позже."
              : "Под эти фильтры в выпуске ничего не подходит. Попробуйте другой язык или запрос."}
          </p>
          <button type="button" className="btn" onClick={resetFilters}>
            Сбросить фильтры
          </button>
        </div>
      )}
    </section>
  );
}
