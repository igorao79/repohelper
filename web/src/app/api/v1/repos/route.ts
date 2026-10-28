import type { NextRequest } from "next/server";

import { apiError, apiOk, parseRange, preflight, requireKey } from "@/lib/api";
import { getIndex, getIssue } from "@/lib/data";
import type { SectionId } from "@/lib/types";

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
  const repo = p.get("repo")?.toLowerCase() ?? null;
  const q = p.get("q")?.trim().toLowerCase() ?? null;
  const language = p.get("language")?.toLowerCase() ?? null;
  const section = p.get("section");
  if (section && section !== "ai" && section !== "hot") return apiError(400, "bad_section", "section: ai или hot");
  if (repo && !/^[\w.-]+\/[\w.-]+$/.test(repo)) return apiError(400, "bad_repo", "repo в формате owner/name");

  const range = parseRange(req, await getIndex());
  if (!range.ok) return range.res;

  const issues = await Promise.all(range.entries.map((e) => getIssue(e.date)));
  const results = issues.flatMap((issue) => {
    if (!issue) return [];
    let rank = 0;
    return issue.sections.flatMap((s) =>
      s.repos.map((r) => ({ ...r, date: issue.date, section: s.id as SectionId, rank: ++rank })),
    );
  }).filter((r) => {
    if (repo && r.full_name.toLowerCase() !== repo) return false;
    if (section && r.section !== section) return false;
    if (language && r.language.toLowerCase() !== language) return false;
    if (q && ![r.full_name, r.description, r.summary].some((t) => t.toLowerCase().includes(q))) return false;
    return true;
  });

  return apiOk({ from: range.from, to: range.to, count: results.length, repos: results });
}

export const OPTIONS = preflight;
