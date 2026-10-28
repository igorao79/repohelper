const numberFmt = new Intl.NumberFormat("ru-RU");
const longDate = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });
const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "long", timeZone: "UTC" });

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

export const formatNumber = (n: number) => numberFmt.format(n);
export const formatGain = (n: number) => `+${numberFmt.format(n)}`;
export const formatDate = (iso: string) => longDate.format(toDate(iso)).replace(/\s?г\.$/, "");
export const formatDay = (iso: string) => shortDate.format(toDate(iso));
export const formatWeekday = (iso: string) => weekday.format(toDate(iso));

/** «10 репозиториев», «1 репозиторий», «3 репозитория». */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** 38904 → «38.9k», 117281 → «117k». */
export function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
}
