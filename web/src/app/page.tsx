import { notFound } from "next/navigation";

import { IssueView } from "@/components/issue-view";
import { getIndex, getIssue } from "@/lib/data";

export default async function Home() {
  const index = await getIndex();
  const latest = index[0];

  if (!latest) {
    return (
      <section className="notice frame" aria-labelledby="empty-title">
        <h1 id="empty-title" className="notice__title">
          Выпусков пока нет
        </h1>
        <p className="notice__text">Первый выпуск появится здесь после 10:00 по Москве, когда бот соберёт тренды дня.</p>
      </section>
    );
  }

  const issue = await getIssue(latest.date);
  if (!issue) notFound();
  return <IssueView issue={issue} index={index} />;
}
