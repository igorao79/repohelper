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
      className="save"
      aria-pressed={isSaved}
      aria-label={isSaved ? `Убрать ${repo.full_name} из отложенных` : `Отложить ${repo.full_name}`}
      onClick={() => toggleSaved(repo)}
    >
      {isSaved ? "Отложено" : "Отложить"}
    </button>
  );
}
