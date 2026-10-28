"use client";

import Link from "next/link";
import { useState } from "react";

import { formatDay } from "@/lib/format";
import type { SavedRepo } from "@/stores/app-store";
import { useAppStore, useSavedHydrated } from "@/stores/app-store-provider";

import { RepoCard } from "./repo-card";
import { useSpotlight } from "./use-spotlight";

export function SavedList() {
  const hydrated = useSavedHydrated();
  const saved = useAppStore((s) => s.saved);
  const removeSaved = useAppStore((s) => s.removeSaved);
  const restoreSaved = useAppStore((s) => s.restoreSaved);
  const [removed, setRemoved] = useState<SavedRepo | null>(null);
  const spotlight = useSpotlight();
  const items = Object.values(saved).sort((a, b) => b.saved_at.localeCompare(a.saved_at));

  if (!hydrated) return <CardsSkeleton count={3} />;

  const remove = (repo: SavedRepo) => {
    setRemoved(repo);
    removeSaved(repo.full_name);
  };

  const undo = removed && (
    <div className="toast card" role="status">
      <span>Убрали {removed.full_name}</span>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
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
        <div className="empty card">
          <p className="empty__title">Здесь пока пусто</p>
          <p>
            Нажмите на закладку в карточке репозитория, и он останется здесь, пока вы его не уберёте. Список хранится
            только в этом браузере.
          </p>
          <Link className="btn btn--primary" href="/">
            Открыть свежий выпуск
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {undo}
      <div className="grid" {...spotlight}>
        {items.map((r, i) => (
          <RepoCard
            key={r.full_name}
            index={i}
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
            extraTag={
              <Link className="tag tag--link" href={`/issue/${r.issue}`}>
                из выпуска {formatDay(r.issue)}
              </Link>
            }
            footer={
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => remove(r)}>
                Убрать
              </button>
            }
          />
        ))}
      </div>
    </>
  );
}

export function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card skeleton-card">
          <div className="skeleton-card__head">
            <span className="skeleton skeleton--avatar" />
            <span className="skeleton skeleton--title" />
          </div>
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--line skeleton--short" />
        </div>
      ))}
    </div>
  );
}
