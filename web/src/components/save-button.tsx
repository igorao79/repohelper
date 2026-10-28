"use client";

import type { SavedRepo } from "@/stores/app-store";
import { useAppStore } from "@/stores/app-store-provider";

import { BookmarkIcon } from "./icons";

type Props = { repo: Omit<SavedRepo, "saved_at"> };

export function SaveButton({ repo }: Props) {
  const isSaved = useAppStore((s) => Boolean(s.saved[repo.full_name]));
  const toggleSaved = useAppStore((s) => s.toggleSaved);

  return (
    <button
      type="button"
      className="icon-btn save-btn"
      aria-pressed={isSaved}
      aria-label={isSaved ? `Убрать ${repo.full_name} из отложенных` : `Отложить ${repo.full_name}`}
      title={isSaved ? "Убрать из отложенных" : "Отложить"}
      onClick={() => toggleSaved(repo)}
    >
      <BookmarkIcon />
    </button>
  );
}
