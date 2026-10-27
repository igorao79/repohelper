"use client";

import type { SavedRepo } from "@/stores/app-store";
import { useAppStore } from "@/stores/app-store-provider";

type Props = { repo: Omit<SavedRepo, "saved_at"> };

export function SaveButton({ repo }: Props) {
  const isSaved = useAppStore((s) => Boolean(s.saved[repo.full_name]));
  const toggleSaved = useAppStore((s) => s.toggleSaved);

  return (
    <button
      type="button"
      className="icon-btn"
      aria-pressed={isSaved}
      aria-label={isSaved ? `Убрать ${repo.full_name} из отложенных` : `Отложить ${repo.full_name}`}
      title={isSaved ? "Убрать из отложенных" : "Отложить"}
      onClick={() => toggleSaved(repo)}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M6 3.75h12a.75.75 0 0 1 .75.75v16.2l-6.75-4.5-6.75 4.5V4.5A.75.75 0 0 1 6 3.75Z" />
      </svg>
    </button>
  );
}
