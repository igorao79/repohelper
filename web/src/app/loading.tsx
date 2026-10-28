import { CardsSkeleton } from "@/components/saved-list";

export default function Loading() {
  return (
    <>
      <div className="page-head container" aria-hidden="true">
        <span className="skeleton skeleton--pill" />
        <span className="skeleton skeleton--h1" />
        <span className="skeleton skeleton--line" />
      </div>
      <section className="container section-pad">
        <CardsSkeleton />
      </section>
    </>
  );
}
