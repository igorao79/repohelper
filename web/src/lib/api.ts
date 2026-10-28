import { type NextRequest, NextResponse } from "next/server";

import { readApiKey } from "./auth";
import type { IndexEntry } from "./types";

// Общее для /api/v1: CORS (ключ в заголовке, без куки — можно звать с любого сайта), ошибки, даты.

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, X-API-Key, Content-Type",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** YYYY-MM-DD и при этом настоящая дата (не 2026-13-01). */
export const isDate = (v: string) =>
  DATE_RE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);
export const MAX_RANGE_DAYS = 90;

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

/** Разбирает ?date=, ?from=, ?to=. Без параметров — последние 30 выпусков. */
export function parseRange(req: NextRequest, index: IndexEntry[]):
  | { ok: true; entries: IndexEntry[]; from: string | null; to: string | null }
  | { ok: false; res: NextResponse } {
  const p = req.nextUrl.searchParams;
  const date = p.get("date");
  const from = date ?? p.get("from");
  const to = date ?? p.get("to");
  for (const [name, v] of [["from", from], ["to", to]] as const) {
    if (v && !isDate(v)) return { ok: false, res: apiError(400, "bad_date", `${name}: дата в формате YYYY-MM-DD`) };
  }
  if (from && to && from > to) return { ok: false, res: apiError(400, "bad_range", "from позже to") };
  if (from && to) {
    const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
    if (days > MAX_RANGE_DAYS) {
      return { ok: false, res: apiError(400, "range_too_wide", `Диапазон не больше ${MAX_RANGE_DAYS} дней`) };
    }
  }
  let entries = index.filter((e) => (!from || e.date >= from) && (!to || e.date <= to));
  if (!from && !to) entries = entries.slice(0, 30);
  return { ok: true, entries, from, to };
}
