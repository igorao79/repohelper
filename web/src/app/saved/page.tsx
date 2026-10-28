import type { Metadata } from "next";

import { SavedList } from "@/components/saved-list";

export const metadata: Metadata = { title: "Отложенные" };

export default function SavedPage() {
  return (
    <>
      <div className="page-head container">
        <p className="pill">Отложенные</p>
        <h1 className="page-title">
          Разобрать <span className="grad-text">позже</span>
        </h1>
        <p className="hero__lead">Репозитории, которые вы отметили в выпусках. Хранятся в этом браузере.</p>
      </div>
      <section className="container section-pad" aria-label="Отложенные репозитории">
        <SavedList />
      </section>
    </>
  );
}
