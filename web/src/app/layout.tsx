import type { Metadata } from "next";
import { IBM_Plex_Mono, Onest, Source_Serif_4 } from "next/font/google";
import Link from "next/link";

import { SiteNav } from "@/components/site-nav";
import { DATA_REPO_URL } from "@/lib/data";
import { AppStoreProvider } from "@/stores/app-store-provider";

import "./globals.css";

// Hanken Grotesk и Newsreader из темы Almanac не умеют кириллицу — берём близкие по сложению.
const display = Onest({ subsets: ["latin", "cyrillic"], weight: ["500", "600"], variable: "--ff-display" });
const body = Source_Serif_4({
  subsets: ["latin", "cyrillic"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--ff-body",
});
const mono = IBM_Plex_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500"], variable: "--ff-mono" });

export const metadata: Metadata = {
  title: { default: "repohelper", template: "%s | repohelper" },
  description: "Ежедневный выпуск трендовых репозиториев GitHub с короткими описаниями на русском.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <AppStoreProvider>
          <header className="site-header">
            <div className="container site-header__inner">
              <Link href="/" className="wordmark" aria-label="repohelper, на главную">
                repohelper
              </Link>
              <SiteNav />
            </div>
          </header>
          <main id="main">{children}</main>
          <footer className="site-footer">
            <div className="container">
              <p>
                Новый выпуск выходит каждый день в 10:00 по Москве: GitHub Trending и свежие ИИ-репозитории, описания
                пишет DeepSeek по README. Тот же выпуск бот отправляет в Telegram. Код и архив открыты{" "}
                <a href={DATA_REPO_URL} target="_blank" rel="noopener noreferrer">
                  на GitHub
                </a>
                .
              </p>
            </div>
          </footer>
        </AppStoreProvider>
      </body>
    </html>
  );
}
