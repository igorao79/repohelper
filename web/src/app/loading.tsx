import { LedgerSkeleton } from "@/components/saved-list";

export default function Loading() {
  return (
    <>
      <div className="page-head container" aria-hidden="true">
        <div className="skeleton skeleton--h1" />
        <div className="skeleton skeleton--line" />
      </div>
      <section className="container">
        <LedgerSkeleton />
      </section>
    </>
  );
}
