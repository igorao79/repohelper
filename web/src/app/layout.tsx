import type { Metadata, Viewport } from "next";
import { Golos_Text, JetBrains_Mono, Unbounded } from "next/font/google";
import Link from "next/link";

import { LogoMark } from "@/components/icons";
import { SiteNav } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { DATA_REPO_URL } from "@/lib/data";
import { STORAGE_KEY } from "@/stores/app-store";
import { AppStoreProvider } from "@/stores/app-store-provider";

import "./globals.css";

const display = Unbounded({ subsets: ["latin", "cyrillic"], weight: ["500", "700"], variable: "--ff-display" });
const body = Golos_Text({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], variable: "--ff-body" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500"], variable: "--ff-mono" });

export const metadata: Metadata = {
  title: { default: "repohelper — тренды GitHub за сутки", template: "%s | repohelper" },
  description: "Ежедневный выпуск трендовых репозиториев GitHub с короткими описаниями на русском.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0d12" },
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
  ],
};

// Выставляет сохранённую тему до первой отрисовки, чтобы не было вспышки другой темы.
const themeScript = `try{var t=(JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"{}").state||{}).theme;if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="backdrop" aria-hidden="true" />
        <AppStoreProvider>
          <header className="site-header">
            <div className="container site-header__inner">
              <Link href="/" className="brand" aria-label="repohelper, на главную">
                <LogoMark />
                <span>repohelper</span>
              </Link>
              <SiteNav variant="top" />
              <ThemeToggle />
            </div>
          </header>

          <main id="main">{children}</main>

          <footer className="site-footer">
            <div className="container site-footer__inner">
              <div className="brand brand--muted">
                <LogoMark size={18} />
                <span>repohelper</span>
              </div>
              <p>
                Новый выпуск каждый день в 10:00 по Москве: GitHub Trending и свежие ИИ-репозитории, описания от
                DeepSeek. Тот же выпуск приходит в Telegram.
              </p>
              <a href={DATA_REPO_URL} target="_blank" rel="noopener noreferrer">
                Исходники на GitHub
              </a>
            </div>
          </footer>

          <SiteNav variant="tabs" />
        </AppStoreProvider>
      </body>
    </html>
  );
}
