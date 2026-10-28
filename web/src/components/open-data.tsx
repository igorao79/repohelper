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
        <h2 id="opendata-title" className="opendata__title" data-reveal>
          Выпуск в&nbsp;JSON
        </h2>
        <form
          className="opendata__form"
          data-reveal
          onSubmit={(e) => {
            e.preventDefault();
            window.open(issueRawUrl(picked), "_blank", "noopener");
          }}
        >
          <label className="opendata__field">
            <span className="visually-hidden">Дата выпуска</span>
            <select name="date" value={picked} onChange={(e) => setPicked(e.target.value)}>
              {options.map((d) => (
                <option key={d} value={d}>
                  Выпуск за {formatDay(d)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="button">
            Открыть JSON
          </button>
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
