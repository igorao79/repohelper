import type { Metadata, Viewport } from "next";
import { Fira_Sans, Fira_Sans_Extra_Condensed } from "next/font/google";
import Link from "next/link";

import { Reveal } from "@/components/reveal";
import { SiteNav } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { DATA_REPO_URL } from "@/lib/urls";
import { STORAGE_KEY } from "@/stores/app-store";
import { AppStoreProvider } from "@/stores/app-store-provider";

import "./globals.css";

// Fira Sans Extra Condensed для заголовков капсом и Fira Sans для текста — одна суперсемья с кириллицей.
const display = Fira_Sans_Extra_Condensed({
  subsets: ["latin", "cyrillic"],
  weight: ["800"],
  variable: "--ff-display",
});
const text = Fira_Sans({ subsets: ["latin", "cyrillic"], weight: ["400", "500"], variable: "--ff-text" });

export const metadata: Metadata = {
  title: { default: "repohelper: тренды GitHub за сутки", template: "%s | repohelper" },
  description: "Ежедневный выпуск трендовых репозиториев GitHub с короткими описаниями на русском.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#161616" },
  ],
};

// До первой отрисовки: сохранённая тема и класс .js (появления включаются только со скриптом).
const bootScript = `document.documentElement.classList.add("js");try{var t=(JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"{}").state||{}).theme;if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <AppStoreProvider>
          <header className="topbar">
            <Link href="/" className="wordmark" aria-label="repohelper, на главную">
              repohelper
            </Link>
            <SiteNav variant="top" />
            <ThemeToggle />
          </header>

          <main id="main">{children}</main>

          <footer className="closing" id="contacts">
            <div className="closing__notes">
              <p>Выпуск каждый день в 10:00 по Москве</p>
              <p>Описания пишет DeepSeek по README, тот же выпуск уходит в Telegram</p>
              <a className="link" href="#main">
                Наверх
              </a>
            </div>
            <a className="closing__address" href={DATA_REPO_URL} target="_blank" rel="noopener noreferrer">
              github.com/
              <wbr />
              igorao79/repohelper
            </a>
            <div className="closing__meta">
              <nav aria-label="Ссылки в подвале">
                <Link className="link" href="/">
                  Выпуск
                </Link>
                <Link className="link" href="/archive">
                  Архив
                </Link>
                <Link className="link" href="/saved">
                  Отложенные
                </Link>
              </nav>
              <p>Превью репозиториев и аватары: GitHub</p>
            </div>
          </footer>

          <SiteNav variant="tabs" />
          <Reveal />
        </AppStoreProvider>
      </body>
    </html>
  );
}
