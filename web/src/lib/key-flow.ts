// Один сценарий «получить ключ» для всех кнопок: гость уходит на вход через GitHub
// и возвращается на страницу с ?get=1#api, где ключ выдаётся автоматически.

export const KEY_PAGE = "/developers?get=1#api";

export const loginUrl = (next: string) => `/api/auth/github?next=${encodeURIComponent(next)}`;

/** Путь текущей страницы с флагом автовыдачи ключа и якорем блока API. */
export function returnHere(): string {
  const url = new URL(window.location.href);
  url.searchParams.set("get", "1");
  url.hash = "api";
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Событие «выдай ключ» для панели на текущей странице (кнопка в хедере → панель). */
export const GET_KEY_EVENT = "repohelper:get-key";
