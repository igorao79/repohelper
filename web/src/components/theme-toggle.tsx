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
      title="Светлая или тёмная тема"
      onClick={() => setTheme(currentTheme() === "dark" ? "light" : "dark")}
    >
      {/* обе иконки в разметке, CSS показывает нужную — так нет мигания при гидратации */}
      <svg className="theme-toggle__sun" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <circle cx="12" cy="12" r="4.25" />
        <path d="M12 2.75v2.5M12 18.75v2.5M2.75 12h2.5M18.75 12h2.5M5.46 5.46l1.77 1.77M16.77 16.77l1.77 1.77M5.46 18.54l1.77-1.77M16.77 7.23l1.77-1.77" />
      </svg>
      <svg className="theme-toggle__moon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M20.25 14.6A8.25 8.25 0 0 1 9.4 3.75a8.25 8.25 0 1 0 10.85 10.85Z" />
      </svg>
    </button>
  );
}
