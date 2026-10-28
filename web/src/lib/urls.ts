// Ссылки на данные в репозитории. Отдельно от data.ts: их импортируют и клиентские компоненты.
export const DATA_REPO_URL = "https://github.com/igorao79/repohelper";

export function issueFileUrl(date: string): string {
  return `${DATA_REPO_URL}/blob/main/data/issues/${date}.json`;
}

export function issueRawUrl(date: string): string {
  return `https://raw.githubusercontent.com/igorao79/repohelper/main/data/issues/${date}.json`;
}
