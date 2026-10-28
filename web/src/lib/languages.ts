// Цвета языков как на GitHub (linguist), для точки рядом с названием.
const COLORS: Record<string, string> = {
  Python: "#3572A5",
  TypeScript: "#3178C6",
  JavaScript: "#F1E05A",
  Rust: "#DEA584",
  Go: "#00ADD8",
  Java: "#B07219",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  "C++": "#F34B7D",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Shell: "#89E051",
  HTML: "#E34C26",
  CSS: "#663399",
  Vue: "#41B883",
  Svelte: "#FF3E00",
  Dart: "#00B4AB",
  Zig: "#EC915C",
  Lua: "#000080",
  "Jupyter Notebook": "#DA5B0B",
  MDX: "#FCB32C",
};

export const languageColor = (lang: string) => COLORS[lang] ?? "#8B93A5";
