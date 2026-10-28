"use client";

import { useAppStore } from "@/stores/app-store-provider";

const currentTheme = () =>
  document.documentElement.dataset.theme ??
  (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

export function ThemeToggle() {
  const setTheme = useAppStore((s) => s.setTheme);

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label="Переключить светлую и тёмную тему"
      onClick={() => setTheme(currentTheme() === "dark" ? "light" : "dark")}
    >
      {/* обе подписи в разметке, CSS показывает нужную — так нет мигания при гидратации */}
      <span className="theme-toggle__to-dark">Тёмная</span>
      <span className="theme-toggle__to-light">Светлая</span>
    </button>
  );
}
