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
