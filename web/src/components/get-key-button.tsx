"use client";

import { useRouter } from "next/navigation";

import { KEY_PAGE, loginUrl } from "@/lib/key-flow";
import { useAppStore } from "@/stores/app-store-provider";

/** Кнопка в хедере и нижней панели: гость сразу идёт на вход через GitHub, вошедший — за ключом. */
export function GetKeyButton({ className = "keybtn" }: { className?: string }) {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const configured = useAppStore((s) => s.authConfigured);

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (user) router.push(KEY_PAGE);
        else if (configured || user === undefined) window.location.assign(loginUrl(KEY_PAGE));
        else router.push("/developers");
      }}
    >
      Получить ключ
    </button>
  );
}
