import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import type { SectionId } from "@/lib/types";

export type SectionFilter = "all" | SectionId;
export type Theme = "dark" | "light";

export type SavedRepo = {
  full_name: string;
  url: string;
  summary: string;
  language: string;
  stars: number;
  issue: string; // дата выпуска, из которого отложен
  saved_at: string;
};

export type Filters = {
  section: SectionFilter;
  language: string; // "" — все языки
  query: string;
  onlySaved: boolean;
};

export type SessionUser = { id: number; login: string; avatar: string };

export type AppState = Filters & {
  saved: Record<string, SavedRepo>;
  /** undefined — ещё не знаем; null — не вошёл. В localStorage не пишется. */
  user: SessionUser | null | undefined;
  authConfigured: boolean;
  theme: Theme | null; // null — как в системе
};

export type AppActions = {
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  toggleSaved: (repo: Omit<SavedRepo, "saved_at">) => void;
  removeSaved: (fullName: string) => void;
  restoreSaved: (repo: SavedRepo) => void;
  setTheme: (theme: Theme) => void;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
};

export type AppStore = AppState & AppActions;

export const STORAGE_KEY = "repohelper-saved";

export const defaultFilters: Filters = { section: "all", language: "", query: "", onlySaved: false };

// Фабрика, а не глобальный стор: в Next.js стор создаётся на каждый запрос (см. гайд Zustand).
// Отложенные и тема хранятся в localStorage; фильтры — только в памяти и в адресной строке.
export const createAppStore = () =>
  createStore<AppStore>()(
    persist(
      (set) => ({
        ...defaultFilters,
        saved: {},
        theme: null,
        user: undefined,
        authConfigured: false,
        setFilters: (patch) => set(patch),
        resetFilters: () => set(defaultFilters),
        toggleSaved: (repo) =>
          set((state) => {
            const saved = { ...state.saved };
            if (saved[repo.full_name]) delete saved[repo.full_name];
            else saved[repo.full_name] = { ...repo, saved_at: new Date().toISOString() };
            return { saved };
          }),
        removeSaved: (fullName) =>
          set((state) => {
            const saved = { ...state.saved };
            delete saved[fullName];
            return { saved };
          }),
        restoreSaved: (repo) => set((state) => ({ saved: { ...state.saved, [repo.full_name]: repo } })),
        setTheme: (theme) => set({ theme }),
        loadUser: async () => {
          try {
            const res = await fetch("/api/auth/me", { cache: "no-store" });
            const data = (await res.json()) as { user: SessionUser | null; configured: boolean };
            set({ user: data.user, authConfigured: data.configured });
          } catch {
            set({ user: null });
          }
        },
        logout: async () => {
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
          set({ user: null });
        },
      }),
      {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => window.localStorage), // на сервере window нет — persist молча выключается
        partialize: (state) => ({ saved: state.saved, theme: state.theme }),
        skipHydration: true, // читаем localStorage после монтирования, чтобы не было расхождения с SSR
      },
    ),
  );
