"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAppStore, useSavedHydrated } from "@/stores/app-store-provider";

import { ArchiveIcon, BookmarkIcon, FlameIcon } from "./icons";

const LINKS = [
  { href: "/", label: "Выпуск", Icon: FlameIcon, match: (p: string) => p === "/" || p.startsWith("/issue/") },
  { href: "/archive", label: "Архив", Icon: ArchiveIcon, match: (p: string) => p === "/archive" },
  { href: "/saved", label: "Отложенные", Icon: BookmarkIcon, match: (p: string) => p === "/saved" },
];

/** variant="top" — пилюли в шапке (планшет и десктоп), variant="tabs" — нижняя панель на телефоне. */
export function SiteNav({ variant }: { variant: "top" | "tabs" }) {
  const pathname = usePathname();
  const savedCount = useAppStore((s) => Object.keys(s.saved).length);
  const hydrated = useSavedHydrated();

  return (
    <nav className={variant === "top" ? "nav-pills" : "tabbar"} aria-label="Разделы сайта">
      {LINKS.map(({ href, label, Icon, match }) => (
        <Link key={href} href={href} aria-current={match(pathname) ? "page" : undefined}>
          {variant === "tabs" && <Icon size={20} />}
          <span>{label}</span>
          {href === "/saved" && hydrated && savedCount > 0 && <span className="count-badge">{savedCount}</span>}
        </Link>
      ))}
    </nav>
  );
}
