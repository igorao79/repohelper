"use client";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <section className="notice frame" role="alert" aria-labelledby="error-title">
      <h1 id="error-title" className="notice__title">
        Выпуск не загрузился
      </h1>
      <p className="notice__text">
        Сайт не смог получить данные с GitHub. Обычно это проходит за минуту, попробуйте ещё раз.
        {digest && ` Код ошибки ${digest}.`}
      </p>
      <button type="button" className="button" onClick={() => retry()}>
        Загрузить снова
      </button>
    </section>
  );
}
