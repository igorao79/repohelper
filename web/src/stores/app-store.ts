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
  issue: string; // дата выпуска, из которого отложен; "" — из Студии
  saved_at: string;
};

export type Filters = {
  section: SectionFilter;
  language: string; // "" — все языки
  query: string;
  onlySaved: boolean;
};

export type SessionUser = { id: number; login: string; avatar: string };

export type StudioRepo = {
  full_name: string;
  url: string;
  description: string;
  stars: number;
  language: string;
  reason: string;
  inDigest?: string;
};

export type StudioMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  repos?: StudioRepo[];
  steps?: string[]; // что агент делал: поиски, чтение README
  pending?: boolean;
  error?: boolean;
};

export type StudioChat = {
  id: string;
  title: string; // первый запрос пользователя, обрезанный
  messages: StudioMessage[];
  updatedAt: number;
};

export type AppState = Filters & {
  studioChats: StudioChat[];
  studioCurrent: string | null; // null — новый пустой чат
  saved: Record<string, SavedRepo>;
  /** undefined — ещё не знаем; null — не вошёл. В localStorage не пишется. */
  user: SessionUser | null | undefined;
  authConfigured: boolean;
  theme: Theme | null; // null — как в системе
};

export type AppActions = {
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  /** Добавляет сообщение в чат; если чата ещё нет — создаёт его с заголовком из первого запроса. */
  addStudioMessage: (chatId: string, m: StudioMessage) => void;
  updateStudioMessage: (chatId: string, id: string, patch: Partial<StudioMessage>) => void;
  newStudioChat: () => void;
  selectStudioChat: (id: string) => void;
  deleteStudioChat: (id: string) => void;
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
        studioChats: [],
        studioCurrent: null,
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
        addStudioMessage: (chatId, m) =>
          set((state) => {
            const exists = state.studioChats.some((c) => c.id === chatId);
            const chats = exists
              ? state.studioChats.map((c) =>
                  c.id === chatId ? { ...c, messages: [...c.messages, m].slice(-60), updatedAt: Date.now() } : c,
                )
              : [
                  { id: chatId, title: m.text.replace(/\s+/g, " ").slice(0, 60), messages: [m], updatedAt: Date.now() },
                  ...state.studioChats,
                ].slice(0, 30);
            return { studioChats: chats, studioCurrent: chatId };
          }),
        updateStudioMessage: (chatId, id, patch) =>
          set((state) => ({
            studioChats: state.studioChats.map((c) =>
              c.id === chatId ? { ...c, messages: c.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) } : c,
            ),
          })),
        newStudioChat: () => set({ studioCurrent: null }),
        selectStudioChat: (id) => set({ studioCurrent: id }),
        deleteStudioChat: (id) =>
          set((state) => ({
            studioChats: state.studioChats.filter((c) => c.id !== id),
            studioCurrent: state.studioCurrent === id ? null : state.studioCurrent,
          })),
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
        // незавершённые ответы не сохраняем — после перезагрузки они бы висели вечно
        partialize: (state) => ({
          saved: state.saved,
          theme: state.theme,
          studioCurrent: state.studioCurrent,
          studioChats: state.studioChats.map((c) => ({ ...c, messages: c.messages.filter((m) => !m.pending) })),
        }),
        // v0 хранил один чат массивом studio — переносим его в первый чат списка.
        version: 1,
        migrate: (persisted, version) => {
          const old = (persisted ?? {}) as Record<string, unknown> & { studio?: StudioMessage[] };
          if (version < 1 && Array.isArray(old.studio) && old.studio.length) {
            const first = old.studio.find((m) => m.role === "user");
            const chat: StudioChat = {
              id: "migrated",
              title: (first?.text ?? "Поиск").slice(0, 60),
              messages: old.studio.filter((m) => !m.pending),
              updatedAt: Date.now(),
            };
            return { ...old, studio: undefined, studioChats: [chat], studioCurrent: chat.id } as unknown as AppStore;
          }
          return old as unknown as AppStore;
        },
        skipHydration: true, // читаем localStorage после монтирования, чтобы не было расхождения с SSR
      },
    ),
  );
