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
  "CLI для перевода README через LLM",
];

type StudioEventLine =
  | { type: "status"; text: string }
  | { type: "result"; reply: string; repos: StudioRepo[] }
  | { type: "error"; text: string };

/** Студия как чат: панель диалогов слева, переписка в узкой колонке, поле ввода закреплено снизу. */
export function Studio() {
  const user = useAppStore((s) => s.user);
  const configured = useAppStore((s) => s.authConfigured);
  const chats = useAppStore((s) => s.studioChats);
  const currentId = useAppStore((s) => s.studioCurrent);
  const newChat = useAppStore((s) => s.newStudioChat);
  const selectChat = useAppStore((s) => s.selectStudioChat);
  const deleteChat = useAppStore((s) => s.deleteStudioChat);
  const store = useAppStoreApi();

  const chat = chats.find((c) => c.id === currentId) ?? null;
  const messages = chat?.messages ?? [];
  const busy = messages.some((m) => m.pending);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const last = messages.at(-1);
  const stepsCount = last?.steps?.length ?? 0;
  const lastPending = Boolean(last?.pending);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [currentId, messages.length, stepsCount, lastPending]);

  const send = async (raw: string) => {
    const query = raw.trim();
    if (!query || busy) return;
    const s = store.getState();
    const chatId = s.studioCurrent && s.studioChats.some((c) => c.id === s.studioCurrent) ? s.studioCurrent : crypto.randomUUID();
    const prior = s.studioChats.find((c) => c.id === chatId)?.messages ?? [];
    const history = [...prior.filter((m) => !m.error), { role: "user" as const, text: query, repos: undefined }].map((m) => ({
      role: m.role,
      text: m.text,
      repos: m.repos?.map((r) => r.full_name),
    }));

    s.addStudioMessage(chatId, { id: crypto.randomUUID(), role: "user", text: query });
    const botId = crypto.randomUUID();
    s.addStudioMessage(chatId, { id: botId, role: "assistant", text: "", steps: [], pending: true });
    setText("");
    const update = (patch: Partial<StudioMessage>) => store.getState().updateStudioMessage(chatId, botId, patch);
    const current = () => store.getState().studioChats.find((c) => c.id === chatId)?.messages.find((m) => m.id === botId);

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
          if (e.type === "status") update({ steps: [...(current()?.steps ?? []), e.text] });
          else if (e.type === "result") update({ text: e.reply, repos: e.repos, pending: false });
          else update({ text: e.text, error: true, pending: false });
        }
      }
      if (current()?.pending) update({ text: "Ответ оборвался. Попробуйте ещё раз.", error: true, pending: false });
    } catch (err) {
      update({ text: err instanceof Error ? err.message : "Студия не ответила", error: true, pending: false });
    }
  };

  const startNew = () => {
    newChat();
    setText("");
    inputRef.current?.focus();
  };

  if (user === undefined) {
    return <div className="sapp sapp--gate"><p className="sapp__muted">Проверяем вход…</p></div>;
  }

  if (!user) {
    return (
      <div className="sapp sapp--gate">
        <h2 className="sapp__hello">Студия</h2>
        <p className="sapp__muted">
          Опишите, что ищете, или вставьте ссылку на репозиторий, и студия подберёт похожие проекты на GitHub. Доступна после
          входа через GitHub.
        </p>
        {configured ? (
          <a className="button" href={loginUrl("/studio")}>
            Войти через GitHub
          </a>
        ) : (
          <p className="sapp__muted">Вход через GitHub ещё не настроен на этом сайте.</p>
        )}
      </div>
    );
  }

  const composer = (
    <form
      className="sbox"
      onSubmit={(e) => {
        e.preventDefault();
        void send(text);
      }}
    >
      <label htmlFor="studio-input" className="visually-hidden">
        Что ищете
      </label>
      <textarea
        ref={inputRef}
        id="studio-input"
        name="query"
        rows={1}
        maxLength={1500}
        placeholder={messages.length ? "Уточните или спросите ещё" : "Опишите задачу или вставьте ссылку на репозиторий"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void send(text);
          }
        }}
      />
      <button type="submit" className="sbox__send" disabled={busy || !text.trim()} aria-label={busy ? "Идёт поиск" : "Отправить"}>
        {busy ? (
          <span className="sbox__spinner" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
          </svg>
        )}
      </button>
    </form>
  );

  return (
    <div className="sapp">
      <aside className="sapp__side" aria-label="Чаты студии">
        <button type="button" className="sapp__new" onClick={startNew}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Новый чат
        </button>
        {chats.length > 0 && <p className="sapp__label">Недавние</p>}
        <ul className="sapp__chats">
          {chats.map((c) => (
            <li key={c.id} className={c.id === currentId ? "is-current" : undefined}>
              <button type="button" className="sapp__chat" onClick={() => selectChat(c.id)} aria-current={c.id === currentId ? "page" : undefined}>
                {c.title}
              </button>
              <button type="button" className="sapp__del" aria-label={`Удалить чат «${c.title}»`} onClick={() => deleteChat(c.id)}>
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="sapp__main">
        <div className="sapp__mobilebar">
          <label className="visually-hidden" htmlFor="studio-chat-select">
            Чат
          </label>
          <select
            id="studio-chat-select"
            value={currentId ?? ""}
            onChange={(e) => (e.target.value ? selectChat(e.target.value) : startNew())}
          >
            <option value="">Новый чат</option>
            {chats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          {chat && (
            <button type="button" className="sapp__new sapp__new--small" onClick={startNew} aria-label="Новый чат">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
        </div>

        {messages.length === 0 ? (
          <div className="sapp__empty">
            <h2 className="sapp__hello">Что ищем, {user.login}?</h2>
            {composer}
            <div className="sapp__examples" role="group" aria-label="Примеры запросов">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => void send(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="sapp__scroll" ref={scrollRef}>
              <ol className="sapp__thread" aria-live="polite">
                {messages.map((m) => (
                  <li key={m.id} className={m.role === "user" ? "smsg smsg--user" : "smsg smsg--bot"}>
                    {m.role === "user" ? <p className="smsg__bubble">{m.text}</p> : <BotMessage message={m} />}
                  </li>
                ))}
              </ol>
            </div>
            <div className="sapp__dock">
              {composer}
              <p className="sapp__note">Студия ищет на GitHub и в выпусках repohelper и может ошибаться. Проверяйте репозитории.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BotMessage({ message: m }: { message: StudioMessage }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="smsg__bot">
      {m.steps && m.steps.length > 0 && (
        <details className="smsg__steps">
          <summary className={m.pending ? "is-live" : undefined}>
            {m.pending ? m.steps.at(-1) : `Поиск: ${m.steps.length} ${m.steps.length < 5 ? "шага" : "шагов"}`}
          </summary>
          <ol>
            {m.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </details>
      )}
      {m.pending && (!m.steps || m.steps.length === 0) && <p className="smsg__steps is-live">Разбираю запрос…</p>}
      {m.text && <p className={m.error ? "smsg__text smsg__text--error" : "smsg__text"}>{m.text}</p>}
      {m.repos && m.repos.length > 0 && (
        <>
          <ol className="srepos">
            {m.repos.map((r) => (
              <li key={r.full_name}>
                <StudioRepoCard repo={r} />
              </li>
            ))}
          </ol>
          <div className="smsg__actions">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(m.repos!.map((r) => r.url).join("\n")).catch(() => undefined);
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
                <path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
              </svg>
              <span aria-live="polite">{copied ? "Скопировано" : "Скопировать ссылки"}</span>
            </button>
          </div>
        </>
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
