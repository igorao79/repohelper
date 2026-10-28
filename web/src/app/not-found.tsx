import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-head container section-pad">
      <p className="pill">404</p>
      <h1 className="page-title">Такого выпуска нет</h1>
      <p className="hero__lead">Возможно, бот в этот день не выходил или в адресе опечатка в дате.</p>
      <Link className="btn btn--primary" href="/archive">
        Открыть архив
      </Link>
    </div>
  );
}
