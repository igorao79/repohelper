"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAppStore, useSavedHydrated } from "@/stores/app-store-provider";

const LINKS = [
  { href: "/", label: "Выпуск", match: (p: string) => p === "/" || p.startsWith("/issue/") },
  { href: "/archive", label: "Архив", match: (p: string) => p === "/archive" },
];

export function SiteNav() {
  const pathname = usePathname();
  const savedCount = useAppStore((s) => Object.keys(s.saved).length);
  const hydrated = useSavedHydrated();

  return (
    <nav className="site-nav" aria-label="Разделы сайта">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={l.match(pathname) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
      <Link href="/saved" aria-current={pathname === "/saved" ? "page" : undefined}>
        Отложенные{hydrated && savedCount > 0 && <span className="num site-nav__count">{savedCount}</span>}
      </Link>
    </nav>
  );
}
