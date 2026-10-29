import type { NextRequest } from "next/server";

import { apiError, apiOk, preflight, requireKey } from "@/lib/api";
import { findRepos } from "@/lib/digest";

/**
 * GET /api/v1/repos — репозитории из выпусков за период.
 * ?repo=owner/name — где и когда появлялся конкретный репозиторий;
 * ?q= — поиск по названию и описанию; ?language=, ?section=ai|hot;
 * ?date= или ?from=&to= (до 90 дней, по умолчанию последние 30 выпусков).
 */
export async function GET(req: NextRequest) {
  const denied = requireKey(req);
  if (denied) return denied;

  const p = req.nextUrl.searchParams;
  const found = await findRepos({
    repo: p.get("repo"),
    q: p.get("q"),
    language: p.get("language"),
    section: p.get("section"),
    date: p.get("date"),
    from: p.get("from"),
    to: p.get("to"),
  });
  if (!found.ok) return apiError(400, found.error.code, found.error.message);
  return apiOk({ from: found.from, to: found.to, count: found.repos.length, repos: found.repos });
}

export const OPTIONS = preflight;
