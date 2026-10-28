"use client";

import { useState } from "react";

/** Open Graph превью репозитория от GitHub; если не загрузилось — градиентная плашка с названием. */
export function RepoPreview({ fullName, priority }: { fullName: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [owner, name] = fullName.split("/");

  if (failed) {
    return (
      <div className="preview-fallback" aria-hidden="true">
        <span>{owner}/</span>
        <b>{name}</b>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- превью с GitHub, отдаётся их CDN
    <img
      src={`https://opengraph.githubassets.com/1/${fullName}`}
      alt=""
      width={1200}
      height={600}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setFailed(true)}
    />
  );
}
