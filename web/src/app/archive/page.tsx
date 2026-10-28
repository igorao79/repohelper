import type { Metadata } from "next";

import { GainBoard } from "@/components/gain-board";
import { getIndex } from "@/lib/data";
import { formatDay, formatWeekday } from "@/lib/format";

export const metadata: Metadata = { title: "Архив выпусков" };

export default async function ArchivePage() {
  const index = await getIndex();

  return (
    <section className="leaders leaders--page frame" aria-labelledby="archive-title">
      <div className="leaders__head">
        <h1 id="archive-title" className="leaders__title">
          Все выпуски
        </h1>
        <p className="leaders__lead">Новые сверху. Полоса — сколько звёзд за день набрал лидер выпуска.</p>
      </div>
      {index.length ? (
        <GainBoard
          label="Выпуски по датам"
          rows={index.map((e, i) => ({
            key: e.date,
            href: `/issue/${e.date}`,
            avatar: e.lead?.split("/")[0],
            title: (
              <>
                {formatDay(e.date)} <span className="board__owner">№{index.length - i}, {formatWeekday(e.date)}</span>
              </>
            ),
            note: `${e.count} репо, ${e.ai_count} про ИИ${e.lead ? `, лидер ${e.lead}` : ""}`,
            value: e.lead_gained,
          }))}
        />
      ) : (
        <div className="empty">
          <p>Архив пока пуст. Первый выпуск появится после 10:00 по Москве.</p>
        </div>
      )}
    </section>
  );
}
