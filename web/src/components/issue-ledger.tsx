"use client";

import { useEffect, useMemo } from "react";

import { formatGain, formatNumber, plural } from "@/lib/format";
import type { Issue, Repo, SectionId } from "@/lib/types";
import { type Filters, type SectionFilter, defaultFilters } from "@/stores/app-store";
import { useAppStore, useAppStoreApi } from "@/stores/app-store-provider";

import { SaveButton } from "./save-button";

type Row = Repo & { rank: number; section: SectionId };

const SECTION_LABELS: Record<SectionFilter, string> = {
  all: "Все",
  ai: "ИИ",
  hot: "Набирают популярность",
};

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

export function IssueLedger({ issue }: { issue: Issue }) {
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

  const leadName = useMemo(
    () => rows.reduce<Row | null>((best, r) => (!best || r.stars_gained > best.stars_gained ? r : best), null)?.full_name,
    [rows],
  );
  const languages = useMemo(() => [...new Set(rows.map((r) => r.language).filter(Boolean))].sort(), [rows]);
  const counts: Record<SectionFilter, number> = {
    all: rows.length,
    ai: rows.filter((r) => r.section === "ai").length,
    hot: rows.filter((r) => r.section === "hot").length,
  };

  const filters = { section, language, query, onlySaved };
  const visible = rows.filter((r) => matches(r, filters, saved));
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(defaultFilters);
  const generatedAt = new Date(issue.generated_at).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  });

  return (
    <section className="ledger-wrap container" aria-labelledby="ledger-title">
      <div className="toolbar" role="search" aria-label="Фильтры выпуска">
        <div className="segmented" role="group" aria-label="Раздел">
          {(Object.keys(SECTION_LABELS) as SectionFilter[]).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={section === id}
              onClick={() => setFilters({ section: id })}
              disabled={id !== "all" && counts[id] === 0}
            >
              {SECTION_LABELS[id]} <span className="num">{counts[id]}</span>
            </button>
          ))}
        </div>

        <label className="field">
          <span className="visually-hidden">Язык</span>
          <select name="lang" value={language} onChange={(e) => setFilters({ language: e.target.value })}>
            <option value="">Все языки</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <label className="field field--grow">
          <span className="visually-hidden">Поиск по выпуску</span>
          <input
            type="search"
            name="q"
            autoComplete="off"
            placeholder="Название или описание"
            value={query}
            onChange={(e) => setFilters({ query: e.target.value })}
          />
        </label>

        <button
          type="button"
          className="btn btn--toggle"
          aria-pressed={onlySaved}
          onClick={() => setFilters({ onlySaved: !onlySaved })}
        >
          Только отложенные
        </button>
      </div>

      <div className="sheet">
        <div className="sheet__head">
          <h2 id="ledger-title">Лист выпуска</h2>
          <p className="sheet__count" role="status">
            {isFiltered
              ? `Показано ${visible.length} из ${rows.length}`
              : `${rows.length} ${plural(rows.length, "репозиторий", "репозитория", "репозиториев")}`}
          </p>
        </div>

        {visible.length > 0 ? (
          <table className="ledger">
            <thead>
              <tr>
                <th scope="col" className="num">
                  №
                </th>
                <th scope="col">Репозиторий</th>
                <th scope="col">Язык</th>
                <th scope="col" className="num">
                  Звёзд
                </th>
                <th scope="col" className="num">
                  За день
                </th>
                <th scope="col">
                  <span className="visually-hidden">Отложить</span>
                </th>
              </tr>
            </thead>
            {issue.sections.map((s) => {
              const sectionRows = visible.filter((r) => r.section === s.id);
              if (!sectionRows.length) return null;
              return (
                <tbody key={s.id}>
                  <tr className="ledger__group">
                    <th scope="colgroup" colSpan={6}>
                      {s.title}
                    </th>
                  </tr>
                  {sectionRows.map((r) => (
                    <LedgerRow key={r.full_name} row={r} issueDate={issue.date} isLead={r.full_name === leadName} />
                  ))}
                </tbody>
              );
            })}
          </table>
        ) : (
          <div className="state state--empty">
            <p>
              {onlySaved && !Object.keys(saved).length
                ? "Вы ещё ничего не отложили. Нажмите на закладку в строке, чтобы вернуться к репозиторию позже."
                : "Под эти фильтры в выпуске ничего не подходит."}
            </p>
            <button type="button" className="btn" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          </div>
        )}

        <p className="sheet__foot">
          Пурпуром отмечен репозиторий, набравший больше всего звёзд за день. Звёзды посчитаны в момент сборки этого
          выпуска, {generatedAt} по Москве.
        </p>
      </div>
    </section>
  );
}

function LedgerRow({ row, issueDate, isLead }: { row: Row; issueDate: string; isLead: boolean }) {
  const [owner, name] = row.full_name.split("/");
  return (
    <tr className={isLead ? "ledger__row is-lead" : "ledger__row"}>
      <td className="num ledger__rank">{row.rank}</td>
      <td className="ledger__repo">
        <a className="ledger__name" href={row.url} target="_blank" rel="noopener noreferrer">
          <span className="ledger__owner">{owner}/</span>
          <wbr />
          {name}
        </a>
        {isLead && <span className="visually-hidden">, больше всех звёзд за день</span>}
        <p className="ledger__summary">{row.summary || row.description}</p>
      </td>
      <td className="ledger__lang" data-label="Язык">
        {row.language || <span className="muted">не указан</span>}
      </td>
      <td className="num" data-label="Звёзд">
        {formatNumber(row.stars)}
      </td>
      <td className="num ledger__gain" data-label={row.gained_label === "за день" ? "За день" : "За неделю"}>
        {formatGain(row.stars_gained)}
        {row.gained_label !== "за день" && <span className="ledger__unit">за неделю</span>}
      </td>
      <td className="ledger__save">
        <SaveButton
          repo={{
            full_name: row.full_name,
            url: row.url,
            summary: row.summary || row.description,
            language: row.language,
            stars: row.stars,
            issue: issueDate,
          }}
        />
      </td>
    </tr>
  );
}
