import type { Metadata } from "next";
import Link from "next/link";

import { getIndex } from "@/lib/data";
import { formatDay, formatGain, formatWeekday } from "@/lib/format";

export const metadata: Metadata = { title: "Архив выпусков" };

export default async function ArchivePage() {
  const index = await getIndex();
  const latestLead = index[0]?.lead;

  return (
    <section className="leaders leaders--page frame" aria-labelledby="archive-title">
      <h1 id="archive-title" className="leaders__title">
        Все выпуски, день за&nbsp;днём
      </h1>
      {index.length ? (
        <div className="leaders__grid">
          {latestLead && (
            <figure className="leaders__photo" data-reveal>
              {/* eslint-disable-next-line @next/next/no-img-element -- аватар автора с GitHub */}
              <img
                src={`https://github.com/${latestLead.split("/")[0]}.png?size=640`}
                alt={`Аватар ${latestLead.split("/")[0]}`}
                width={640}
                height={640}
              />
              <figcaption>
                {latestLead}, лидер последнего выпуска: {formatGain(index[0].lead_gained)} звёзд за сутки.
              </figcaption>
            </figure>
          )}
          <p className="leaders__word" aria-hidden="true">
            выпуски
          </p>
          <ol className="leaders__table leaders__table--archive" data-reveal>
            {index.map((e, i) => (
              <li key={e.date}>
                <Link href={`/issue/${e.date}`}>
                  <span className="leaders__kind">
                    №{index.length - i}, {formatWeekday(e.date)}
                  </span>
                  <span className="leaders__name">
                    {formatDay(e.date)}
                    <span className="leaders__owner">
                      {" "}
                      {e.count} репо, {e.ai_count} про ИИ{e.lead ? `, лидер ${e.lead.split("/")[1]}` : ""}
                    </span>
                  </span>
                  <span className="leaders__value">{e.lead ? formatGain(e.lead_gained) : ""}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="empty">
          <p>Архив пока пуст. Первый выпуск появится после 10:00 по Москве.</p>
        </div>
      )}
    </section>
  );
}
