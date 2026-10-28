"use client";

import { useEffect, useRef, useState } from "react";

import { formatCompact, formatDay } from "@/lib/format";
import { loginUrl } from "@/lib/key-flow";
import { languageColor } from "@/lib/languages";
import type { StudioMessage, StudioRepo } from "@/stores/app-store";
import { useAppStore, useAppStoreApi } from "@/stores/app-store-provider";

import { RepoPicture } from "./repo-picture";
import { SaveButton } from "./save-button";

const EXAMPLES = [
  "Похожее на https://github.com/supabase/supabase, но на Go",
  "Лёгкая библиотека графиков для React",
  "Self-hosted замена Notion",
  "CLI для перевода README на другие языки через LLM",
];

type StudioEventLine =
  | { type: "status"; text: string }
  | { type: "result"; reply: string; repos: StudioRepo[] }
  | { type: "error"; text: string };

/** Чат для поиска репозиториев: запрос или ссылка → агент ищет на GitHub → карточки с причинами. */
export function Studio() {
  const user = useAppStore((s) => s.user);
  const configured = useAppStore((s) => s.authConfigured);
  const messages = useAppStore((s) => s.studio);
  const clearStudio = useAppStore((s) => s.clearStudio);
  const store = useAppStoreApi();
  const [text, setText] = useState("");
  const busy = messages.some((m) => m.pending);
  const endRef = useRef<HTMLDivElement>(null);

  const last = messages.at(-1);
  const stepsCount = last?.steps?.length ?? 0;
  const lastPending = Boolean(last?.pending);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, stepsCount, lastPending]);

  const send = async (raw: string) => {
    const query = raw.trim();
    if (!query || busy) return;
    const { addStudioMessage, updateStudioMessage } = store.getState();
    const history = [...store.getState().studio, { id: "", role: "user" as const, text: query }]
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, text: m.text, repos: m.repos?.map((r) => r.full_name) }));
    addStudioMessage({ id: crypto.randomUUID(), role: "user", text: query });
    const botId = crypto.randomUUID();
    addStudioMessage({ id: botId, role: "assistant", text: "", steps: [], pending: true });
    setText("");

    try {
      const res = await fetch("/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Студия не ответила");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line) as StudioEventLine;
          const current = store.getState().studio.find((m) => m.id === botId);
          if (e.type === "status") updateStudioMessage(botId, { steps: [...(current?.steps ?? []), e.text] });
          else if (e.type === "result") updateStudioMessage(botId, { text: e.reply, repos: e.repos, pending: false });
          else updateStudioMessage(botId, { text: e.text, error: true, pending: false });
        }
      }
      const final = store.getState().studio.find((m) => m.id === botId);
      if (final?.pending) updateStudioMessage(botId, { text: "Ответ оборвался. Попробуйте ещё раз.", error: true, pending: false });
    } catch (err) {
      updateStudioMessage(botId, {
        text: err instanceof Error ? err.message : "Студия не ответила",
        error: true,
        pending: false,
      });
    }
  };

  if (user === undefined) {
    return (
      <div className="studio__gate">
        <p className="studio__lead">Проверяем вход…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="studio__gate">
        <p className="studio__lead">
          Студия доступна после входа через GitHub: поиск идёт от вашего имени, поэтому лимиты GitHub у каждого свои.
        </p>
        {configured ? (
          <a className="button" href={loginUrl("/studio")}>
            Войти через GitHub
          </a>
        ) : (
          <p className="studio__lead">Вход через GitHub ещё не настроен на этом сайте.</p>
        )}
      </div>
    );
  }

  return (
    <div className="studio__chat">
      {messages.length === 0 ? (
        <div className="studio__examples" role="group" aria-label="Примеры запросов">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => void send(ex)}>
              {ex}
            </button>
          ))}
        </div>
      ) : (
        <ol className="studio__thread" aria-live="polite">
          {messages.map((m) => (
            <li key={m.id} className={m.role === "user" ? "msg msg--user" : "msg msg--bot"}>
              {m.role === "user" ? <p className="msg__bubble">{m.text}</p> : <BotMessage message={m} />}
            </li>
          ))}
        </ol>
      )}
      <div ref={endRef} />

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <label htmlFor="studio-input" className="visually-hidden">
          Что ищете
        </label>
        <textarea
          id="studio-input"
          name="query"
          rows={1}
          maxLength={1500}
          placeholder="Опишите задачу или вставьте ссылку на репозиторий"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send(text);
            }
          }}
        />
        <button type="submit" className="button" disabled={busy || !text.trim()}>
          {busy ? "Ищу…" : "Найти"}
        </button>
        {messages.length > 0 && !busy && (
          <button type="button" className="composer__reset" onClick={clearStudio}>
            Новый чат
          </button>
        )}
      </form>
    </div>
  );
}

function BotMessage({ message: m }: { message: StudioMessage }) {
  return (
    <div className="msg__bot">
      {m.steps && m.steps.length > 0 && (
        <details className="msg__steps" open={m.pending}>
          <summary>{m.pending ? m.steps.at(-1) : `Сделано шагов: ${m.steps.length}`}</summary>
          <ol>
            {m.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </details>
      )}
      {m.pending && (!m.steps || m.steps.length === 0) && <p className="msg__thinking">Разбираю запрос…</p>}
      {m.text && <p className={m.error ? "msg__text msg__text--error" : "msg__text"}>{m.text}</p>}
      {m.repos && m.repos.length > 0 && (
        <div className="srepos">
          {m.repos.map((r) => (
            <StudioRepoCard key={r.full_name} repo={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function StudioRepoCard({ repo: r }: { repo: StudioRepo }) {
  const [owner, name] = r.full_name.split("/");
  return (
    <article className="srepo">
      <a className="srepo__picture" href={r.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
        <RepoPicture fullName={r.full_name} alt="" />
      </a>
      <div className="srepo__body">
        <h3 className="srepo__title">
          <a href={r.url} target="_blank" rel="noopener noreferrer">
            <span className="entry__owner">{owner}/</span>
            <wbr />
            {name}
          </a>
        </h3>
        <p className="srepo__reason">{r.reason}</p>
        <p className="entry__meta">
          {r.language && (
            <span className="entry__lang">
              <span className="entry__dot" style={{ background: languageColor(r.language) }} />
              {r.language}
            </span>
          )}
          <span>{formatCompact(r.stars)} звёзд</span>
          {r.inDigest && <span>был в выпуске за {formatDay(r.inDigest)}</span>}
        </p>
      </div>
      <SaveButton
        repo={{ full_name: r.full_name, url: r.url, summary: r.reason || r.description, language: r.language, stars: r.stars, issue: "" }}
      />
    </article>
  );
}
