"use client";

import { useEffect, useMemo } from "react";

import { plural } from "@/lib/format";
import type { Issue, Repo, SectionId } from "@/lib/types";
import { type Filters, type SectionFilter, defaultFilters } from "@/stores/app-store";
import { useAppStore, useAppStoreApi } from "@/stores/app-store-provider";

import { RepoEntry } from "./repo-entry";

type Row = Repo & { rank: number; section: SectionId };

const SECTIONS: { id: SectionFilter; label: string }[] = [
  { id: "all", label: "Весь выпуск" },
  { id: "ai", label: "ИИ" },
  { id: "hot", label: "Набирают популярность" },
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
      window.history.replaceState(null, "", qs ? `?${qs}#repos` : `${window.location.pathname}#repos`);
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

/** Секция выпуска: её заголовок — поле поиска, под ним записи отвечают на запрос. */
export function IssueBoard({ issue }: { issue: Issue }) {
  useFiltersInUrl();

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
  const languages = useMemo(() => [...new Set(rows.map((r) => r.language).filter(Boolean))].sort(), [rows]);
  const counts: Record<SectionFilter, number> = {
    all: rows.length,
    ai: rows.filter((r) => r.section === "ai").length,
    hot: rows.filter((r) => r.section === "hot").length,
  };

  const filters = { section, language, query, onlySaved };
  const visible = rows.filter((r) => matches(r, filters, saved));
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(defaultFilters);
  const savedEmpty = onlySaved && !Object.keys(saved).length;

  return (
    <section className="issue frame" id="repos" aria-labelledby="issue-title">
      <h2 id="issue-title" className="issue__title" data-reveal>
        <label htmlFor="q">Найти в выпуске</label>
      </h2>

      <div className="ask" data-ui data-reveal>
        <input
          id="q"
          className="ask__input"
          type="search"
          name="q"
          autoComplete="off"
          spellCheck={false}
          placeholder="агенты для кода"
          value={query}
          onChange={(e) => setFilters({ query: e.target.value })}
        />
      </div>

      <div className="ask__examples" role="group" aria-label="Фильтры выпуска" data-reveal>
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={section === id}
            onClick={() => setFilters({ section: id })}
            disabled={id !== "all" && counts[id] === 0}
          >
            {label} <span className="ask__count">{counts[id]}</span>
          </button>
        ))}
        {languages.map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={language === l}
            onClick={() => setFilters({ language: language === l ? "" : l })}
          >
            {l}
          </button>
        ))}
        <button type="button" aria-pressed={onlySaved} onClick={() => setFilters({ onlySaved: !onlySaved })}>
          Отложенные
        </button>
      </div>

      <p className="issue__status" role="status">
        {isFiltered
          ? `Подходит ${visible.length} из ${rows.length}`
          : `${rows.length} ${plural(rows.length, "репозиторий", "репозитория", "репозиториев")} в выпуске`}
      </p>

      {visible.length > 0 ? (
        <div className="entries">
          {visible.map((r) => (
            <RepoEntry key={r.full_name} repo={r} rank={r.rank} isAi={r.section === "ai"} issueDate={issue.date} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p>
            {savedEmpty
              ? "Вы ещё ничего не отложили. Нажмите «Отложить» у записи, и она останется в разделе «Отложенные»."
              : "В этом выпуске под запрос ничего не подходит. Попробуйте другое слово или язык."}
          </p>
          <button type="button" className="button button--ghost" onClick={resetFilters}>
            Сбросить поиск и фильтры
          </button>
        </div>
      )}
    </section>
  );
}
