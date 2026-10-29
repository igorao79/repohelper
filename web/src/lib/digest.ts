import { getIndex, getIssue } from "./data";
import type { IndexEntry, SectionId } from "./types";

// Выборки по выпускам — общие для API v1 и MCP.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** YYYY-MM-DD и при этом настоящая дата (не 2026-13-01). */
export const isDate = (v: string) =>
  DATE_RE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);
export const MAX_RANGE_DAYS = 90;

export type RangeQuery = { date?: string | null; from?: string | null; to?: string | null };
export type DigestError = { code: string; message: string };

/** Выпуски за date или from–to (до 90 дней). Без дат — последние 30. */
export function pickRange(index: IndexEntry[], q: RangeQuery):
  | { ok: true; entries: IndexEntry[]; from: string | null; to: string | null }
  | { ok: false; error: DigestError } {
  const from = q.date || q.from || null;
  const to = q.date || q.to || null;
  for (const [name, v] of [["from", from], ["to", to]] as const) {
    if (v && !isDate(v)) return { ok: false, error: { code: "bad_date", message: `${name}: дата в формате YYYY-MM-DD` } };
  }
  if (from && to && from > to) return { ok: false, error: { code: "bad_range", message: "from позже to" } };
  if (from && to) {
    const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
    if (days > MAX_RANGE_DAYS) {
      return { ok: false, error: { code: "range_too_wide", message: `Диапазон не больше ${MAX_RANGE_DAYS} дней` } };
    }
  }
  let entries = index.filter((e) => (!from || e.date >= from) && (!to || e.date <= to));
  if (!from && !to) entries = entries.slice(0, 30);
  return { ok: true, entries, from, to };
}

export type RepoQuery = RangeQuery & {
  repo?: string | null;
  q?: string | null;
  language?: string | null;
  section?: string | null;
};

/** Репозитории из выпусков за период, каждый с датой, разделом и местом в выпуске. */
export async function findRepos(query: RepoQuery) {
  const repo = query.repo?.trim().toLowerCase() || null;
  const q = query.q?.trim().toLowerCase() || null;
  const language = query.language?.trim().toLowerCase() || null;
  const section = query.section || null;
  if (section && section !== "ai" && section !== "hot") {
    return { ok: false as const, error: { code: "bad_section", message: "section: ai или hot" } };
  }
  if (repo && !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return { ok: false as const, error: { code: "bad_repo", message: "repo в формате owner/name" } };
  }

  const range = pickRange(await getIndex(), query);
  if (!range.ok) return range;

  const issues = await Promise.all(range.entries.map((e) => getIssue(e.date)));
  const repos = issues.flatMap((issue) => {
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

  return { ok: true as const, from: range.from, to: range.to, repos };
}
