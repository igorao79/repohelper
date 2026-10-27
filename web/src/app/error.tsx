"use client";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <div className="page-head container" role="alert">
      <h1>Выпуск не загрузился</h1>
      <p className="lead">
        Сайт не смог получить данные с GitHub. Обычно это проходит за минуту: попробуйте ещё раз.
        {digest && <span className="muted"> Код ошибки {digest}.</span>}
      </p>
      <button type="button" className="btn btn--primary" onClick={() => retry()}>
        Загрузить снова
      </button>
    </div>
  );
}
