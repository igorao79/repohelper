// Запросы к GitHub для Студии: поиск репозиториев и карточка репо с началом README.
// Токен — пользователя (из входа) или GITHUB_TOKEN; без токена у GitHub жёсткий лимит поиска.

export type GhRepo = {
  full_name: string;
  url: string;
  description: string;
  stars: number;
  language: string;
  topics: string[];
  pushed_at: string;
  archived: boolean;
};

type RawRepo = {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  topics?: string[];
  pushed_at: string;
  archived: boolean;
};

const toRepo = (r: RawRepo): GhRepo => ({
  full_name: r.full_name,
  url: r.html_url,
  description: r.description ?? "",
  stars: r.stargazers_count,
  language: r.language ?? "",
  topics: r.topics ?? [],
  pushed_at: r.pushed_at,
  archived: r.archived,
});

export class GitHubError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function gh(path: string, token: string | null, accept = "application/vnd.github+json"): Promise<Response> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: accept,
      "User-Agent": "repohelper-studio",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  if (res.status === 403 || res.status === 429) throw new GitHubError(res.status, "GitHub временно ограничил поиск, попробуйте через минуту");
  return res;
}

export async function searchRepos(
  token: string | null,
  { query, language, minStars = 20 }: { query: string; language?: string; minStars?: number },
): Promise<GhRepo[]> {
  const q = [query.trim(), language ? `language:"${language}"` : "", `stars:>=${minStars}`, "archived:false"]
    .filter(Boolean)
    .join(" ");
  const res = await gh(`/search/repositories?q=${encodeURIComponent(q)}&per_page=8`, token);
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: RawRepo[] };
  return (data.items ?? []).map(toRepo);
}

export async function getRepo(token: string | null, fullName: string): Promise<(GhRepo & { readme: string }) | null> {
  if (!/^[\w.-]+\/[\w.-]+$/.test(fullName)) return null;
  const res = await gh(`/repos/${fullName}`, token);
  if (!res.ok) return null;
  const repo = toRepo((await res.json()) as RawRepo);
  const readmeRes = await gh(`/repos/${fullName}/readme`, token, "application/vnd.github.raw");
  const readme = readmeRes.ok ? (await readmeRes.text()).replace(/<[^>]+>/g, " ").replace(/\n{3,}/g, "\n\n").slice(0, 2500) : "";
  return { ...repo, readme };
}
