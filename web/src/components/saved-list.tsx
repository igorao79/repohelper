"use client";

import Link from "next/link";
import { useState } from "react";

import { formatDay, formatNumber } from "@/lib/format";
import type { SavedRepo } from "@/stores/app-store";
import { useAppStore, useSavedHydrated } from "@/stores/app-store-provider";

export function SavedList() {
  const hydrated = useSavedHydrated();
  const saved = useAppStore((s) => s.saved);
  const removeSaved = useAppStore((s) => s.removeSaved);
  const restoreSaved = useAppStore((s) => s.restoreSaved);
  const [removed, setRemoved] = useState<SavedRepo | null>(null);
  const items = Object.values(saved).sort((a, b) => b.saved_at.localeCompare(a.saved_at));

  if (!hydrated) return <LedgerSkeleton rows={3} />;

  const remove = (repo: SavedRepo) => {
    setRemoved(repo);
    removeSaved(repo.full_name);
  };

  const undo = removed && (
    <div className="undo" role="status">
      <p>Убрали {removed.full_name}.</p>
      <button
        type="button"
        className="btn"
        onClick={() => {
          restoreSaved(removed);
          setRemoved(null);
        }}
      >
        Вернуть
      </button>
    </div>
  );

  if (!items.length) {
    return (
      <div className="sheet">
        {undo}
        <div className="state state--empty">
          <p>
            Здесь пусто. Нажмите на закладку в строке выпуска, и репозиторий останется здесь, пока вы его не уберёте.
            Список хранится только в этом браузере.
          </p>
          <Link className="btn" href="/">
            Открыть свежий выпуск
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet">
      {undo}
      <table className="ledger ledger--saved">
        <thead>
          <tr>
            <th scope="col">Репозиторий</th>
            <th scope="col">Язык</th>
            <th scope="col" className="num">
              Звёзд
            </th>
            <th scope="col">Из выпуска</th>
            <th scope="col">
              <span className="visually-hidden">Убрать</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => {
            const [owner, name] = r.full_name.split("/");
            return (
              <tr key={r.full_name} className="ledger__row">
                <td className="ledger__repo">
                  <a className="ledger__name" href={r.url} target="_blank" rel="noopener noreferrer">
                    <span className="ledger__owner">{owner}/</span>
                    <wbr />
                    {name}
                  </a>
                  <p className="ledger__summary">{r.summary}</p>
                </td>
                <td className="ledger__lang" data-label="Язык">
                  {r.language || <span className="muted">не указан</span>}
                </td>
                <td className="num" data-label="Звёзд">
                  {formatNumber(r.stars)}
                </td>
                <td className="ledger__issue" data-label="Из выпуска">
                  <Link href={`/issue/${r.issue}`}>{formatDay(r.issue)}</Link>
                </td>
                <td className="ledger__save">
                  <button type="button" className="btn btn--quiet" onClick={() => remove(r)}>
                    Убрать
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function LedgerSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="sheet" aria-busy="true" aria-label="Загрузка">
      <div className="skeleton skeleton--head" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--line" />
        </div>
      ))}
    </div>
  );
}
