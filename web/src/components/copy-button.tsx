"use client";

import { useState } from "react";

import { CopyIcon } from "./icons";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn btn--ghost"
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
      <CopyIcon size={16} />
      <span aria-live="polite">{copied ? "Скопировано" : label}</span>
    </button>
  );
}
