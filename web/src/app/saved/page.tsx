import type { Metadata } from "next";

import { SavedList } from "@/components/saved-list";

export const metadata: Metadata = { title: "Отложенные" };

export default function SavedPage() {
  return (
    <section className="issue frame issue--page" aria-labelledby="saved-title">
      <h1 id="saved-title" className="issue__title issue__title--page">
        Отложенные репозитории
      </h1>
      <p className="issue__status">Хранятся в этом браузере, пока вы их не уберёте.</p>
      <SavedList />
    </section>
  );
}
