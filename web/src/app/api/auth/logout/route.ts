import { type NextRequest, NextResponse } from "next/server";

import { GH_TOKEN_COOKIE, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  if (req.cookies.has(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE);
  if (req.cookies.has(GH_TOKEN_COOKIE)) res.cookies.delete(GH_TOKEN_COOKIE);
  return res;
}
