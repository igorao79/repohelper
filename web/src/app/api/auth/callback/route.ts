import { type NextRequest, NextResponse } from "next/server";

import {
  GH_TOKEN_COOKIE,
  SESSION_COOKIE,
  STATE_COOKIE,
  authConfigured,
  cookieOptions,
  createSession,
  encryptToken,
  siteOrigin,
} from "@/lib/auth";

/** GitHub вернул code: меняем на токен, читаем профиль, ставим подписанную сессию. */
export async function GET(req: NextRequest) {
  const origin = siteOrigin(req);
  const fail = (reason: string) => {
    const res = NextResponse.redirect(`${origin}/?login=${reason}#api`);
    res.cookies.delete(STATE_COOKIE);
    return res;
  };
  if (!authConfigured()) return fail("not_configured");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const [expected, next = "/#api"] = (req.cookies.get(STATE_COOKIE)?.value ?? "").split("|");
  if (!code || !state || state !== expected) return fail("state");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${origin}/api/auth/callback`,
    }),
    cache: "no-store",
  });
  const token = (await tokenRes.json().catch(() => null)) as { access_token?: string } | null;
  if (!token?.access_token) return fail("token");

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "repohelper" },
    cache: "no-store",
  });
  const user = (await userRes.json().catch(() => null)) as { id?: number; login?: string; avatar_url?: string } | null;
  if (!user?.id || !user.login) return fail("profile");

  const session = createSession({ id: user.id, login: user.login, avatar: user.avatar_url ?? "" });
  const res = NextResponse.redirect(`${origin}${next}`);
  res.cookies.set(SESSION_COOKIE, session.value, cookieOptions(session.maxAge));
  res.cookies.set(GH_TOKEN_COOKIE, encryptToken(token.access_token), cookieOptions(session.maxAge));
  res.cookies.delete(STATE_COOKIE);
  return res;
}
