import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";

import type { IndexEntry, Issue } from "./types";

// Выпуски пишет бот в data/ репозитория. На Vercel читаем их с GitHub,
// локально — с диска (DATA_DIR=../data в .env.local).
const DATA_BASE_URL =
  process.env.DATA_BASE_URL ?? "https://raw.githubusercontent.com/igorao79/repohelper/main/data";

export const DATA_REPO_URL = "https://github.com/igorao79/repohelper";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function load<T>(file: string): Promise<T | null> {
  if (process.env.DATA_DIR) {
    try {
      return JSON.parse(await readFile(path.join(process.env.DATA_DIR, file), "utf8")) as T;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }
  const res = await fetch(`${DATA_BASE_URL}/${file}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ответил ${res.status} на ${file}`);
  return (await res.json()) as T;
}

export async function getIndex(): Promise<IndexEntry[]> {
  "use cache";
  cacheLife("hours");
  return (await load<IndexEntry[]>("index.json")) ?? [];
}

export async function getIssue(date: string): Promise<Issue | null> {
  "use cache";
  cacheLife("hours");
  if (!DATE_RE.test(date)) return null;
  return load<Issue>(`issues/${date}.json`);
}

export function issueFileUrl(date: string): string {
  return `${DATA_REPO_URL}/blob/main/data/issues/${date}.json`;
}
