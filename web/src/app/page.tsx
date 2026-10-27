import { notFound } from "next/navigation";

import { IssueView } from "@/components/issue-view";
import { getIndex, getIssue } from "@/lib/data";

export default async function Home() {
  const index = await getIndex();
  const latest = index[0];

  if (!latest) {
    return (
      <div className="page-head container">
        <h1>Выпусков пока нет</h1>
        <p className="lead">Первый выпуск появится здесь после 10:00 по Москве, когда бот соберёт тренды дня.</p>
      </div>
    );
  }

  const issue = await getIssue(latest.date);
  if (!issue) notFound();
  return <IssueView issue={issue} index={index} />;
}
