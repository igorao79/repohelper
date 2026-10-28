import type { NextRequest } from "next/server";

import { apiError, apiOk, isDate, preflight, requireKey } from "@/lib/api";
import { getIssue } from "@/lib/data";

/** GET /api/v1/issues/{date} — весь выпуск за день: разделы и репозитории с описаниями. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ date: string }> }) {
  const denied = requireKey(req);
  if (denied) return denied;

  const { date } = await ctx.params;
  if (!isDate(date)) return apiError(400, "bad_date", "Дата в формате YYYY-MM-DD");
  const issue = await getIssue(date);
  if (!issue) return apiError(404, "not_found", `Выпуска за ${date} нет`);
  return apiOk(issue);
}

export const OPTIONS = preflight;
