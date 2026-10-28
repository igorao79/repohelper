import { type NextRequest, NextResponse } from "next/server";

import { STATE_COOKIE, authConfigured, cookieOptions, randomState, safeNext, siteOrigin } from "@/lib/auth";

/** Старт входа: редирект на GitHub с одноразовым state в cookie. */
export async function GET(req: NextRequest) {
  if (!authConfigured()) {
    return NextResponse.json({ error: { code: "auth_not_configured", message: "Вход через GitHub ещё не настроен" } }, { status: 503 });
  }
  const state = randomState();
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
  url.searchParams.set("redirect_uri", `${siteOrigin(req)}/api/auth/callback`);
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url);
  res.cookies.set(STATE_COOKIE, `${state}|${next}`, cookieOptions(600));
  return res;
}
