"use client";

import type { PointerEvent } from "react";

/** Подсветка карточки под курсором: пишет координаты в CSS-переменные --mx/--my ближайшей .card. */
export function useSpotlight() {
  return {
    onPointerMove(e: PointerEvent<HTMLElement>) {
      if (e.pointerType !== "mouse") return;
      const card = (e.target as HTMLElement).closest<HTMLElement>(".card");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    },
  };
}
