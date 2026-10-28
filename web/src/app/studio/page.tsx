import type { Metadata } from "next";

import { Studio } from "@/components/studio";

export const metadata: Metadata = {
  title: "Студия",
  description: "Поиск репозиториев GitHub по описанию задачи или по ссылке на похожий проект.",
};

export default function StudioPage() {
  return (
    <section className="studio frame" aria-labelledby="studio-title">
      <div className="studio__head">
        <h1 id="studio-title" className="studio__title">
          Студия
        </h1>
        <p className="studio__lead">
          Опишите, что ищете, или вставьте ссылку на репозиторий. Студия поищет на GitHub и в выпусках repohelper и
          предложит похожие проекты с объяснением, чем каждый подходит.
        </p>
      </div>
      <Studio />
    </section>
  );
}
