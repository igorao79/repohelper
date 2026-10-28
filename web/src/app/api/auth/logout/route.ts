import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  if (req.cookies.has(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE);
  return res;
}
