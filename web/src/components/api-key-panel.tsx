"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAppStore } from "@/stores/app-store-provider";

import { CopyButton } from "./copy-button";

const SITE = "https://repohelper.site";

/** Кнопка «Получить ключ»: доступна после входа через GitHub, ключ показывается один раз. */
export function ApiKeyPanel() {
  const pathname = usePathname();
  const user = useAppStore((s) => s.user);
  const configured = useAppStore((s) => s.authConfigured);
  const [key, setKey] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const getKey = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/keys", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      setKey(((await res.json()) as { key: string }).key);
      setState("idle");
    } catch {
      setState("error");
    }
  };

  const loggedIn = Boolean(user);
  const example = `curl -H "Authorization: Bearer ${key ?? "rh_ваш_ключ"}" \\\n  "${SITE}/api/v1/repos?from=2026-10-01&to=2026-10-31&section=ai"`;

  return (
    <div className="keypanel">
      <div className="keypanel__actions">
        <button type="button" className="button" disabled={!loggedIn || state === "loading"} onClick={() => void getKey()}>
          {state === "loading" ? "Выдаём ключ…" : key ? "Получить новый ключ" : "Получить ключ"}
        </button>
        {!loggedIn && user !== undefined && configured && (
          <a className="button button--ghost" href={`/api/auth/github?next=${encodeURIComponent(`${pathname}#api`)}`}>
            Войти через GitHub
          </a>
        )}
      </div>
      <p className="keypanel__hint" role="status">
        {user === undefined
          ? "Проверяем вход…"
          : !configured
            ? "Вход через GitHub ещё не настроен на этом сайте."
            : !loggedIn
              ? "Ключ выдаётся после входа через GitHub."
              : state === "error"
                ? "Не получилось выдать ключ. Попробуйте ещё раз или войдите заново."
                : key
                  ? "Сохраните ключ: он показывается один раз. Старые ключи продолжают работать."
                  : `Вы вошли как ${user!.login}.`}
      </p>
      {key && (
        <figure className="keypanel__key">
          <pre>
            <code>{key}</code>
          </pre>
          <CopyButton text={key} label="Скопировать ключ" />
        </figure>
      )}
      <figure className="keypanel__example">
        <pre>
          <code>{example}</code>
        </pre>
        <figcaption>Репозитории про ИИ из выпусков за октябрь.</figcaption>
      </figure>
    </div>
  );
}
