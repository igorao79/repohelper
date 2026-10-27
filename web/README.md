# repohelper web

Сайт с ежедневными выпусками repohelper: лист выпуска с фильтрами, архив и отложенные репозитории.

- Next.js 16 (App Router, Cache Components), TypeScript, Zustand.
- Данные: `data/` из корня репозитория. В продакшене читаются с `raw.githubusercontent.com` (`src/lib/data.ts`, кэш на час), локально с диска через `DATA_DIR=../data` в `.env.local`.
- Фильтры (раздел, язык, поиск) хранятся в Zustand и зеркалятся в адресную строку; отложенные сохраняются в `localStorage`.

```bash
npm install
npm run dev
```

На Vercel укажите Root Directory = `web`.
