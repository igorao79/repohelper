import type { Metadata } from "next";

import { SavedList } from "@/components/saved-list";

export const metadata: Metadata = { title: "Отложенные" };

export default function SavedPage() {
  return (
    <>
      <div className="page-head container">
        <h1>Отложенные</h1>
        <p className="lead">Репозитории, которые вы отметили в выпусках, чтобы разобрать позже.</p>
      </div>
      <section className="ledger-wrap container" aria-label="Отложенные репозитории">
        <SavedList />
      </section>
    </>
  );
}
