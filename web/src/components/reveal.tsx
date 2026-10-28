"use client";

import { useEffect } from "react";

/**
 * Появление частей секций при прокрутке: [data-reveal] получает .is-in, когда входит в экран.
 * Контент страницы стримится позже layout, поэтому новые элементы ловим через MutationObserver.
 * Без JS и при reduced motion всё видно сразу — класс .js на <html> ставит inline-скрипт.
 */
export function Reveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    const watch = () => document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return null;
}
