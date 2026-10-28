"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { GET_KEY_EVENT, loginUrl, returnHere } from "@/lib/key-flow";
import { useAppStore } from "@/stores/app-store-provider";

import { CopyButton } from "./copy-button";

const SITE = "https://repohelper.site";

/**
 * «Получить ключ»: гость по клику сразу уходит на вход через GitHub и возвращается сюда с ?get=1,
 * после чего ключ выдаётся автоматически. Ключ показывается один раз.
 */
export function ApiKeyPanel() {
  const user = useAppStore((s) => s.user);
  const configured = useAppStore((s) => s.authConfigured);
  const [key, setKey] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const autoRequested = useRef(false);

  const getKey = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch("/api/keys", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      setKey(((await res.json()) as { key: string }).key);
      setState("idle");
    } catch {
      setState("error");
    }
  }, []);

  // Вернулись со входа через GitHub с ?get=1 — выдаём ключ сразу и убираем флаг из адреса.
  useEffect(() => {
    if (!user || autoRequested.current) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("get") !== "1") return;
    autoRequested.current = true;
    url.searchParams.delete("get");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    setTimeout(() => void getKey(), 0); // запрос вне тела эффекта; повтор отсекает autoRequested
  }, [user, getKey]);

  // Кнопка «Получить ключ» в хедере на этой же странице.
  useEffect(() => {
    const onRequest = () => void getKey();
    window.addEventListener(GET_KEY_EVENT, onRequest);
    return () => window.removeEventListener(GET_KEY_EVENT, onRequest);
  }, [getKey]);

  const onClick = () => {
    if (user) void getKey();
    else window.location.assign(loginUrl(returnHere()));
  };

  const example = `curl -H "Authorization: Bearer ${key ?? "rh_ваш_ключ"}" \\\n  "${SITE}/api/v1/repos?from=2026-10-01&to=2026-10-31&section=ai"`;

  return (
    <div className="keypanel">
      <div className="keypanel__actions">
        <button
          type="button"
          className="button"
          disabled={state === "loading" || (user === null && !configured)}
          onClick={onClick}
        >
          {state === "loading" ? "Выдаём ключ…" : key ? "Получить новый ключ" : "Получить ключ"}
        </button>
      </div>
      <p className="keypanel__hint" role="status">
        {user === undefined
          ? "Проверяем вход…"
          : !configured
            ? "Вход через GitHub ещё не настроен на этом сайте."
            : !user
              ? "Нажмите, войдите через GitHub, и ключ появится здесь."
              : state === "error"
                ? "Не получилось выдать ключ. Попробуйте ещё раз или войдите заново."
                : key
                  ? "Сохраните ключ: он показывается один раз. Старые ключи продолжают работать."
                  : `Вы вошли как ${user.login}.`}
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
