"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAppStore, useSavedHydrated } from "@/stores/app-store-provider";

const LINKS = [
  { href: "/", label: "Выпуск", match: (p: string) => p === "/" || p.startsWith("/issue/") },
  { href: "/archive", label: "Архив", match: (p: string) => p === "/archive" },
  { href: "/saved", label: "Отложенные", match: (p: string) => p === "/saved" },
  { href: "/developers", label: "API", match: (p: string) => p === "/developers" },
];

/** Нижняя панель уезжает при прокрутке вниз и возвращается при прокрутке вверх, чтобы не закрывать текст. */
function useHideOnScrollDown(enabled: boolean) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 8;
        if (Math.abs(y - last) > 6) setHidden(y > last && y > 120 && !nearBottom);
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled]);
  return hidden;
}

/** variant="top" — ссылки в верхней строке (планшет и десктоп), variant="tabs" — нижняя панель на телефоне. */
export function SiteNav({ variant }: { variant: "top" | "tabs" }) {
  const pathname = usePathname();
  const savedCount = useAppStore((s) => Object.keys(s.saved).length);
  const hydrated = useSavedHydrated();
  const hidden = useHideOnScrollDown(variant === "tabs");

  return (
    <nav
      className={variant === "top" ? "topnav" : hidden ? "tabbar is-hidden" : "tabbar"}
      aria-label="Разделы сайта"
    >
      {LINKS.map(({ href, label, match }) => (
        <Link key={href} href={href} aria-current={match(pathname) ? "page" : undefined}>
          {label}
          {href === "/saved" && hydrated && savedCount > 0 && <span className="count">{savedCount}</span>}
        </Link>
      ))}
    </nav>
  );
}
