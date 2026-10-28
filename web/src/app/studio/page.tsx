import type { Metadata } from "next";

import { Studio } from "@/components/studio";

export const metadata: Metadata = {
  title: "Студия",
  description: "Поиск репозиториев GitHub по описанию задачи или по ссылке на похожий проект.",
};

export default function StudioPage() {
  return (
    <section className="studio-page" aria-labelledby="studio-title">
      <h1 id="studio-title" className="visually-hidden">
        Студия: поиск репозиториев
      </h1>
      <Studio />
    </section>
  );
}
