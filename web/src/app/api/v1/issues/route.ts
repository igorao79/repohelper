import type { NextRequest } from "next/server";

import { apiOk, parseRange, preflight, requireKey } from "@/lib/api";
import { getIndex } from "@/lib/data";

/**
 * GET /api/v1/issues — список выпусков.
 * ?date=YYYY-MM-DD или ?from=&to= (до 90 дней). Без параметров — последние 30.
 */
export async function GET(req: NextRequest) {
  const denied = requireKey(req);
  if (denied) return denied;

  const range = parseRange(req, await getIndex());
  if (!range.ok) return range.res;
  return apiOk({
    from: range.from,
    to: range.to,
    count: range.entries.length,
    issues: range.entries.map((e) => ({ ...e, url: `/api/v1/issues/${e.date}` })),
  });
}

export const OPTIONS = preflight;
