import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";

// Сессии и ключи API — подписанные токены (HMAC-SHA256 на AUTH_SECRET), без базы данных.
// Ключ проверяется по подписи; отозвать все ключи разом можно сменой AUTH_SECRET.

export const SESSION_COOKIE = "rh_session";
export const STATE_COOKIE = "rh_oauth_state";
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 дней

export type SessionUser = { id: number; login: string; avatar: string };
type SessionPayload = SessionUser & { exp: number };
type KeyPayload = { u: number; l: string; t: number };

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET не задан или короче 32 символов");
  return s;
}

const b64 = (data: string | Buffer) => Buffer.from(data).toString("base64url");
const sign = (body: string, purpose: string) => createHmac("sha256", secret()).update(`${purpose}.${body}`).digest("base64url");

function seal(payload: object, purpose: string): string {
  const body = b64(JSON.stringify(payload));
  return `${body}.${sign(body, purpose)}`;
}

function open<T>(token: string | undefined, purpose: string): T | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body, purpose));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export const authConfigured = () =>
  Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && (process.env.AUTH_SECRET?.length ?? 0) >= 32);

export const randomState = () => randomBytes(16).toString("base64url");

export function createSession(user: SessionUser): { value: string; maxAge: number } {
  const payload: SessionPayload = { ...user, exp: Math.floor(Date.now() / 1000) + SESSION_TTL };
  return { value: seal(payload, "session"), maxAge: SESSION_TTL };
}

export function readSession(req: NextRequest): SessionUser | null {
  if (!authConfigured()) return null;
  const s = open<SessionPayload>(req.cookies.get(SESSION_COOKIE)?.value, "session");
  if (!s || s.exp < Date.now() / 1000) return null;
  return { id: s.id, login: s.login, avatar: s.avatar };
}

export function issueApiKey(user: SessionUser): string {
  return `rh_${seal({ u: user.id, l: user.login, t: Math.floor(Date.now() / 1000) } satisfies KeyPayload, "api-key")}`;
}

/** Ключ из Authorization: Bearer, X-API-Key или ?key=. Возвращает владельца или null. */
export function readApiKey(req: NextRequest): { id: number; login: string } | null {
  const header = req.headers.get("authorization");
  const raw =
    (header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null) ??
    req.headers.get("x-api-key") ??
    req.nextUrl.searchParams.get("key");
  if (!raw?.startsWith("rh_") || !authConfigured()) return null;
  const k = open<KeyPayload>(raw.slice(3), "api-key");
  return k ? { id: k.u, login: k.l } : null;
}

/** Адрес сайта для redirect_uri: SITE_URL, если задан, иначе origin запроса. */
export const siteOrigin = (req: NextRequest) => process.env.SITE_URL?.replace(/\/$/, "") ?? req.nextUrl.origin;

/** Только относительные пути внутри сайта — защита от открытого редиректа. */
export const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/#api");

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});
