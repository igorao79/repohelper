"use client";

import Link from "next/link";
import { useState } from "react";

import { issueRawUrl } from "@/lib/urls";
import { formatDay } from "@/lib/format";

import { CopyButton } from "./copy-button";

type Props = {
  sample: Record<string, string | number> | null;
  date: string;
  dates: string[];
  fileUrl: string;
  older: { date: string; label: string } | null;
};

/** Закрывающая фраза с пропуском: пропуск — выбор даты, последнее слово — кнопка. */
export function OpenData({ sample, date, dates, fileUrl, older }: Props) {
  const [picked, setPicked] = useState(date);
  const options = dates.length ? dates : [date];

  return (
    <section className="opendata frame" aria-labelledby="opendata-title">
      <div className="opendata__copy">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.open(issueRawUrl(picked), "_blank", "noopener");
          }}
        >
          <h2 id="opendata-title" className="opendata__line" data-reveal>
            Выпуск за{" "}
            <select
              className="opendata__select"
              name="date"
              aria-label="Дата выпуска"
              value={picked}
              onChange={(e) => setPicked(e.target.value)}
            >
              {options.map((d) => (
                <option key={d} value={d}>
                  {formatDay(d)}
                </option>
              ))}
            </select>{" "}
            в{" "}
            <button type="submit" className="opendata__go">
              JSON
            </button>
          </h2>
        </form>
        <p className="opendata__note" data-reveal>
          Каждое утро бот кладёт выпуск в репозиторий файлом{" "}
          <a
            className="link"
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            data/issues/{date}.json
          </a>
          .{" "}
          <CopyButton
            text={issueRawUrl(picked)}
            label="Скопировать ссылку на файл"
          />
          {older && (
            <>
              {" "}
              <Link className="link" href={`/issue/${older.date}`} rel="prev">
                Предыдущий выпуск, {older.label}
              </Link>
            </>
          )}
        </p>
      </div>
      {sample && (
        <figure className="opendata__code" data-reveal>
          <pre>
            <code>{JSON.stringify(sample, null, 2)}</code>
          </pre>
          <figcaption>
            Первая запись из data/issues/{date}.json, лидер дня.
          </figcaption>
        </figure>
      )}
    </section>
  );
}
