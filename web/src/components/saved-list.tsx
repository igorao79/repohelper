"use client";

import Link from "next/link";
import { useState } from "react";

import { formatDay } from "@/lib/format";
import type { SavedRepo } from "@/stores/app-store";
import { useAppStore, useSavedHydrated } from "@/stores/app-store-provider";

import { RepoEntry } from "./repo-entry";

export function SavedList() {
  const hydrated = useSavedHydrated();
  const saved = useAppStore((s) => s.saved);
  const removeSaved = useAppStore((s) => s.removeSaved);
  const restoreSaved = useAppStore((s) => s.restoreSaved);
  const [removed, setRemoved] = useState<SavedRepo | null>(null);
  const items = Object.values(saved).sort((a, b) => b.saved_at.localeCompare(a.saved_at));

  if (!hydrated) return <EntriesSkeleton count={3} />;

  const remove = (repo: SavedRepo) => {
    setRemoved(repo);
    removeSaved(repo.full_name);
  };

  const undo = removed && (
    <div className="undo" role="status">
      <p>Убрали {removed.full_name}.</p>
      <button
        type="button"
        className="button button--ghost"
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
      <>
        {undo}
        <div className="empty">
          <p>
            Здесь пусто. Нажмите «Отложить» у записи в выпуске, и репозиторий останется здесь, пока вы его не уберёте.
            Список хранится только в этом браузере.
          </p>
          <Link className="button" href="/#repos">
            Открыть свежий выпуск
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {undo}
      <div className="entries">
        {items.map((r) => (
          <RepoEntry
            key={r.full_name}
            issueDate={r.issue}
            repo={{
              full_name: r.full_name,
              url: r.url,
              description: "",
              summary: r.summary,
              language: r.language,
              stars: r.stars,
              stars_gained: 0,
              gained_label: "",
              topics: [],
            }}
            note={
              r.issue ? (
                <Link className="link" href={`/issue/${r.issue}`}>
                  из выпуска за {formatDay(r.issue)}
                </Link>
              ) : (
                <Link className="link" href="/studio">
                  из Студии
                </Link>
              )
            }
            aside={
              <button type="button" className="save" onClick={() => remove(r)}>
                Убрать
              </button>
            }
          />
        ))}
      </div>
    </>
  );
}

export function EntriesSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="entries" aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="entry">
          <span className="skeleton entry__picture" />
          <div className="entry__body">
            <span className="skeleton skeleton--title" />
            <span className="skeleton skeleton--line" />
            <span className="skeleton skeleton--line skeleton--short" />
          </div>
        </div>
      ))}
    </div>
  );
}
