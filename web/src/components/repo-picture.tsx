"use client";

import { useState } from "react";

/** Превью репозитория от GitHub; если CDN не ответил — аватар владельца того же репо. */
export function RepoPicture({ fullName, alt, priority }: { fullName: string; alt: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  const owner = fullName.split("/")[0];

  return (
    // eslint-disable-next-line @next/next/no-img-element -- картинки отдаёт CDN GitHub
    <img
      src={failed ? `https://github.com/${owner}.png?size=800` : `https://opengraph.githubassets.com/1/${fullName}`}
      alt={alt}
      width={1200}
      height={600}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
