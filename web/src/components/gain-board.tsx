import Link from "next/link";

import { formatGain } from "@/lib/format";

export type BoardRow = {
  key: string;
  href: string;
  external?: boolean;
  avatar?: string; // владелец на GitHub, для аватара
  title: React.ReactNode;
  note?: string;
  value: number; // прирост звёзд — длина полосы
};

/** Рейтинг по приросту звёзд: строка — место, аватар, название и полоса, пропорциональная приросту. */
export function GainBoard({ rows, label }: { rows: BoardRow[]; label: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <ol className="board" aria-label={label} data-reveal>
      {rows.map((r, i) => {
        const content = (
          <>
            <span className="board__rank">{i + 1}</span>
            {r.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- аватар владельца с GitHub
              <img
                className="board__avatar"
                src={`https://github.com/${r.avatar}.png?size=80`}
                alt=""
                width={40}
                height={40}
                loading="lazy"
              />
            ) : (
              <span className="board__avatar" aria-hidden="true" />
            )}
            <span className="board__name">
              <span>{r.title}</span>
              {r.note && <span className="board__note">{r.note}</span>}
            </span>
            <span className="board__bar" aria-hidden="true">
              <span style={{ "--w": r.value / max } as React.CSSProperties} />
            </span>
            <span className="board__value">{r.value ? formatGain(r.value) : ""}</span>
          </>
        );
        return (
          <li key={r.key}>
            {r.external ? (
              <a href={r.href} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            ) : (
              <Link href={r.href}>{content}</Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
