"use client";

import { type ReactNode, createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { useStore } from "zustand";

import { type AppStore, createAppStore } from "./app-store";

export type AppStoreApi = ReturnType<typeof createAppStore>;

const AppStoreContext = createContext<AppStoreApi | undefined>(undefined);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createAppStore);

  useEffect(() => {
    void store.persist.rehydrate();
    void store.getState().loadUser();
    // Тема из стора → атрибут на <html>. До гидратации её уже выставил inline-скрипт в layout.
    return store.subscribe((state, prev) => {
      if (state.theme === prev.theme) return;
      if (state.theme) document.documentElement.dataset.theme = state.theme;
      else delete document.documentElement.dataset.theme;
    });
  }, [store]);

  return <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>;
}

export function useAppStore<T>(selector: (store: AppStore) => T): T {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error("useAppStore должен вызываться внутри AppStoreProvider");
  return useStore(store, selector);
}

export function useAppStoreApi(): AppStoreApi {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error("useAppStoreApi должен вызываться внутри AppStoreProvider");
  return store;
}

/** true после того, как отложенные прочитаны из localStorage. */
export function useSavedHydrated(): boolean {
  const store = useAppStoreApi();
  return useSyncExternalStore(
    (onChange) => store.persist.onFinishHydration(onChange),
    () => store.persist.hasHydrated(),
    () => false,
  );
}
