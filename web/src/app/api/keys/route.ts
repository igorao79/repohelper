import { type NextRequest, NextResponse } from "next/server";

import { issueApiKey, readSession } from "@/lib/auth";

/** Выдаёт новый ключ API вошедшему пользователю. Только с этого же сайта (проверка Origin). */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin && origin !== process.env.SITE_URL?.replace(/\/$/, "")) {
    return NextResponse.json({ error: { code: "bad_origin", message: "Запрос не с сайта repohelper" } }, { status: 403 });
  }
  const user = readSession(req);
  if (!user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Войдите через GitHub" } }, { status: 401 });
  }
  return NextResponse.json({ key: issueApiKey(user), login: user.login }, { headers: { "Cache-Control": "no-store" } });
}
