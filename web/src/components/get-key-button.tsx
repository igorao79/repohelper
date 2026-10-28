"use client";

import { useRouter } from "next/navigation";

import { GET_KEY_EVENT, KEY_PAGE, loginUrl } from "@/lib/key-flow";
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
        if (user) {
          // Панель ключа уже на этой странице — выдаём ключ прямо в ней, без перехода.
          const panel = document.querySelector(".keypanel");
          if (panel) {
            panel.scrollIntoView({ behavior: "smooth", block: "center" });
            window.dispatchEvent(new Event(GET_KEY_EVENT));
          } else router.push(KEY_PAGE);
        }
        else if (configured || user === undefined) window.location.assign(loginUrl(KEY_PAGE));
        else router.push("/developers");
      }}
    >
      Получить ключ
    </button>
  );
}
