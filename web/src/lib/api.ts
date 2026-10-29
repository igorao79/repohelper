import { type NextRequest, NextResponse } from "next/server";

import { readApiKey } from "./auth";
import { pickRange } from "./digest";
import type { IndexEntry } from "./types";

export { isDate } from "./digest";

// Общее для /api/v1: CORS (ключ в заголовке, без куки — можно звать с любого сайта), ошибки, даты.

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, X-API-Key, Content-Type",
};

export function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: CORS });
}

export function apiOk(data: unknown) {
  return NextResponse.json(data, { headers: { ...CORS, "Cache-Control": "private, max-age=300" } });
}

export const preflight = () => new NextResponse(null, { status: 204, headers: CORS });

/** null, если ключ в порядке; иначе готовый ответ 401. */
export function requireKey(req: NextRequest): NextResponse | null {
  if (readApiKey(req)) return null;
  return apiError(
    401,
    "invalid_key",
    "Нужен ключ API: заголовок Authorization: Bearer rh_… или X-API-Key. Ключ выдаётся на repohelper.site после входа через GitHub.",
  );
}

/** ?date=, ?from=, ?to= из адреса. Без параметров — последние 30 выпусков. */
export function parseRange(req: NextRequest, index: IndexEntry[]):
  | { ok: true; entries: IndexEntry[]; from: string | null; to: string | null }
  | { ok: false; res: NextResponse } {
  const p = req.nextUrl.searchParams;
  const range = pickRange(index, { date: p.get("date"), from: p.get("from"), to: p.get("to") });
  return range.ok ? range : { ok: false, res: apiError(400, range.error.code, range.error.message) };
}
