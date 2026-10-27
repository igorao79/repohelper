import type { Metadata } from "next";
import Link from "next/link";

import { getIndex } from "@/lib/data";
import { formatDate, formatGain, formatWeekday } from "@/lib/format";

export const metadata: Metadata = { title: "Архив выпусков" };

export default async function ArchivePage() {
  const index = await getIndex();

  return (
    <>
      <div className="page-head container">
        <h1>Архив выпусков</h1>
        <p className="lead">Все выпуски, новые сверху. Каждый хранит десять репозиториев дня с описаниями.</p>
      </div>

      <section className="ledger-wrap container" aria-label="Список выпусков">
        <div className="sheet">
          {index.length ? (
            <table className="ledger ledger--archive">
              <thead>
                <tr>
                  <th scope="col">Выпуск</th>
                  <th scope="col">День</th>
                  <th scope="col" className="num">
                    Репозиториев
                  </th>
                  <th scope="col" className="num">
                    Про ИИ
                  </th>
                  <th scope="col">Лидер дня</th>
                  <th scope="col" className="num">
                    Звёзд за день
                  </th>
                </tr>
              </thead>
              <tbody>
                {index.map((e, i) => (
                  <tr key={e.date} className={i === 0 ? "ledger__row is-latest" : "ledger__row"}>
                    <td>
                      <Link className="ledger__name" href={`/issue/${e.date}`}>
                        {formatDate(e.date)}
                      </Link>
                    </td>
                    <td data-label="День">{formatWeekday(e.date)}</td>
                    <td className="num" data-label="Репозиториев">
                      {e.count}
                    </td>
                    <td className="num" data-label="Про ИИ">
                      {e.ai_count}
                    </td>
                    <td data-label="Лидер дня">{e.lead ?? <span className="muted">нет</span>}</td>
                    <td className="num" data-label="Звёзд за день">
                      {e.lead ? formatGain(e.lead_gained) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="state state--empty">
              <p>Архив пока пуст. Первый выпуск появится после 10:00 по Москве.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
