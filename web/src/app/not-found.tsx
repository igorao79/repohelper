import Link from "next/link";

export default function NotFound() {
  return (
    <section className="notice frame" aria-labelledby="nf-title">
      <h1 id="nf-title" className="notice__title">
        Такого выпуска нет
      </h1>
      <p className="notice__text">Возможно, бот в этот день не выходил или в адресе опечатка в дате.</p>
      <Link className="button" href="/archive">
        Открыть архив
      </Link>
    </section>
  );
}
