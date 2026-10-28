"use client";

import { useAppStore } from "@/stores/app-store-provider";

import { MoonIcon, SunIcon } from "./icons";

const currentTheme = () =>
  document.documentElement.dataset.theme ??
  (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

export function ThemeToggle() {
  const setTheme = useAppStore((s) => s.setTheme);

  return (
    <button
      type="button"
      className="icon-btn theme-toggle"
      aria-label="Переключить тему"
      title="Светлая или тёмная тема"
      onClick={() => setTheme(currentTheme() === "light" ? "dark" : "light")}
    >
      {/* обе иконки в разметке, CSS показывает нужную — так нет мигания при гидратации */}
      <SunIcon className="theme-toggle__sun" />
      <MoonIcon className="theme-toggle__moon" />
    </button>
  );
}
