import type { Metadata } from "next";
import Link from "next/link";

import { ArrowUpRightIcon } from "@/components/icons";
import { getIndex } from "@/lib/data";
import { formatGain, formatWeekday } from "@/lib/format";

export const metadata: Metadata = { title: "Архив выпусков" };

const dayNum = (iso: string) => Number(iso.slice(8, 10));
const monthShort = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU", { month: "short", timeZone: "UTC" })
    .format(new Date(`${iso}T00:00:00Z`))
    .replace(".", "");

export default async function ArchivePage() {
  const index = await getIndex();

  return (
    <>
      <div className="page-head container">
        <p className="pill">Архив</p>
        <h1 className="page-title">
          Все выпуски, <span className="grad-text">день за днём</span>
        </h1>
        <p className="hero__lead">Каждый выпуск хранит десять репозиториев дня с описаниями. Новые сверху.</p>
      </div>

      <section className="container section-pad" aria-label="Список выпусков">
        {index.length ? (
          <ol className="archive">
            {index.map((e, i) => {
              const [owner, name] = (e.lead ?? "/").split("/");
              return (
                <li key={e.date}>
                  <Link className={i === 0 ? "archive__card card is-latest" : "archive__card card"} href={`/issue/${e.date}`}>
                    <div className="archive__date">
                      <span className="archive__day">{dayNum(e.date)}</span>
                      <span className="archive__month">
                        {monthShort(e.date)}, {formatWeekday(e.date)}
                      </span>
                    </div>
                    <div className="archive__body">
                      <span className="archive__label">
                        Выпуск №{index.length - i}
                        {i === 0 && <span className="tag tag--lead">свежий</span>}
                      </span>
                      {e.lead && (
                        <span className="archive__lead">
                          Лидер дня: {owner}/<b>{name}</b> <span className="gain">{formatGain(e.lead_gained)}</span>
                        </span>
                      )}
                      <span className="archive__meta">
                        {e.count} репозиториев, из них {e.ai_count} про ИИ
                      </span>
                    </div>
                    <ArrowUpRightIcon className="archive__arrow" />
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="empty card">
            <p className="empty__title">Архив пока пуст</p>
            <p>Первый выпуск появится после 10:00 по Москве.</p>
          </div>
        )}
      </section>
    </>
  );
}
