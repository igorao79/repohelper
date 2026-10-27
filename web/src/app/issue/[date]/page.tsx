import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { IssueView } from "@/components/issue-view";
import { getIndex, getIssue } from "@/lib/data";
import { formatDate } from "@/lib/format";

type Props = { params: Promise<{ date: string }> };

export async function generateStaticParams() {
  const index = await getIndex();
  // С Cache Components нужен хотя бы один параметр; остальные даты рендерятся при первом запросе.
  return index.length ? index.map((e) => ({ date: e.date })) : [{ date: "1970-01-01" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  const issue = await getIssue(date);
  return issue ? { title: `Выпуск за ${formatDate(date)}` } : { title: "Выпуск не найден" };
}

export default async function IssuePage({ params }: Props) {
  const { date } = await params;
  const [issue, index] = await Promise.all([getIssue(date), getIndex()]);
  if (!issue) notFound();
  return <IssueView issue={issue} index={index} />;
}
