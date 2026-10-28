"use client";

import { useState } from "react";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="link link--button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          window.prompt("Скопируйте ссылку:", text);
        }
      }}
    >
      <span aria-live="polite">{copied ? "Ссылка скопирована" : label}</span>
    </button>
  );
}
