# repohelper

Бот раз в день собирает репозитории, которые набирают звёзды на GitHub, просит DeepSeek коротко описать каждый и публикует дайджест в Telegram-группу.

**Источники**
- [GitHub Trending](https://github.com/trending) за день: общий список и по языкам (Python, TypeScript, JavaScript, Rust, Go). Официального API у трендов нет, поэтому страница парсится.
- GitHub Search API: свежие репозитории с топиками `ai`, `llm`, `ai-agents`, `agents`. Используется, если ИИ-раздел не набрался из трендов.

**Как устроен дайджест**
- 🤖 **ИИ**: 5 репо. DeepSeek читает README и сам решает, про ИИ проект или нет.
- 📈 **Набирают популярность**: следующие 5 по приросту звёзд за день.
- Один и тот же репо не повторяется 7 дней (`seen.json`).

## Запуск локально

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env   # заполнить токены
.venv/bin/python bot.py --dry-run   # напечатать, не отправляя
.venv/bin/python bot.py             # отправить в группу
```

Бот должен быть участником группы. `TELEGRAM_CHAT_ID` для обычной группы выглядит как `-5312324242`, для супергруппы — `-100…`.

## Сервер

```bash
curl -fsSL https://raw.githubusercontent.com/igorao79/repohelper/main/deploy/install.sh | bash
nano /opt/repohelper/.env
systemctl start repohelper.service   # прогнать сразу
journalctl -u repohelper -n 50       # логи
```

Таймер systemd запускает бота каждый день в 10:00 по Москве. Время меняется в `deploy/repohelper.timer`.

## Архив и сайт

После отправки бот кладёт выпуск в `data/issues/<дата>.json` и обновляет `data/index.json`. С `GIT_PUSH=1` в `.env` он коммитит и пушит `data/` (на сервере для этого настроен deploy key с правом записи).

Сайт лежит в `web/`: Next.js 16, TypeScript, Zustand (фильтры выпуска и отложенные репозитории в `localStorage`). Он читает `data/` прямо с GitHub и кэширует на час, так что новый выпуск появляется без пересборки.

```bash
cd web
npm install
npm run dev   # локально читает ../data (DATA_DIR в .env.local)
```

**Vercel:** импортировать репозиторий, в настройках проекта указать *Root Directory* = `web` и задать переменные:

| Переменная | Зачем |
| --- | --- |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | вход через GitHub (OAuth App, callback `https://www.repohelper.site/api/auth/callback`) |
| `AUTH_SECRET` | подпись сессий и ключей API, 32+ символа: `openssl rand -base64 48`. Смена секрета отзывает все ключи |
| `SITE_URL` | необязательно: `https://www.repohelper.site`, если redirect_uri должен быть фиксированным |
| `DATA_BASE_URL` | необязательно: другой источник JSON, если репозиторий станет приватным |

## API

Ключ выдаётся на сайте после входа через GitHub (кнопка «Получить ключ»), передаётся в `Authorization: Bearer rh_…` или `X-API-Key`. Документация: `/developers`.

- `GET /api/v1/issues?from=YYYY-MM-DD&to=YYYY-MM-DD` — выпуски за период (до 90 дней; без параметров — последние 30)
- `GET /api/v1/issues/{date}` — выпуск за день целиком
- `GET /api/v1/repos?repo=owner/name|q=…&language=…&section=ai|hot&from=&to=` — репозитории из выпусков с датой, разделом и местом
