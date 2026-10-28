import { EntriesSkeleton } from "@/components/saved-list";

export default function Loading() {
  return (
    <section className="issue frame issue--page" aria-busy="true" aria-label="Загрузка выпуска">
      <span className="skeleton skeleton--h1" />
      <EntriesSkeleton />
    </section>
  );
}
