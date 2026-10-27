"""Ежедневный дайджест трендовых репозиториев GitHub в Telegram.

Запуск:
    python bot.py            — собрать, отправить и сохранить выпуск в data/
    python bot.py --dry-run  — только напечатать, ничего не отправлять
    python bot.py --no-send  — собрать и сохранить в data/, не отправляя в Telegram
"""
import argparse
import html
import json
import logging
import os
from datetime import date, datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv

from archive import push_data, save_issue
from sources import Repo, fetch_new_ai_repos, fetch_readme, fetch_trending
from summarizer import DeepSeek
from telegram import Telegram

BASE_DIR = Path(__file__).resolve().parent
STATE_FILE = BASE_DIR / "seen.json"
DATA_DIR = BASE_DIR / "data"
TRENDING_LANGUAGES = ["", "python", "typescript", "javascript", "rust", "go"]  # "" — все языки
MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня",
          "июля", "августа", "сентября", "октября", "ноября", "декабря"]

log = logging.getLogger("repohelper")


def load_seen() -> dict[str, str]:
    try:
        return json.loads(STATE_FILE.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_seen(seen: dict[str, str], repeat_days: int) -> None:
    cutoff = (date.today() - timedelta(days=repeat_days * 4)).isoformat()
    seen = {k: v for k, v in seen.items() if v >= cutoff}
    STATE_FILE.write_text(json.dumps(seen, ensure_ascii=False, indent=2))


Item = tuple[Repo, str]


def describe(repo: Repo, deepseek: DeepSeek) -> tuple[str, bool]:
    try:
        summary, is_ai = deepseek.summarize(repo, fetch_readme(repo.full_name))
    except Exception as e:  # одно падение не должно ронять весь дайджест
        log.warning("DeepSeek не ответил для %s: %s", repo.full_name, e)
        summary, is_ai = repo.description or "Описание недоступно.", repo.is_ai
    log.info("%s [%s] → %s", repo.full_name, "ai" if is_ai else "hot", summary)
    return summary, is_ai


def collect(seen: dict[str, str], repeat_days: int, ai_count: int, hot_count: int,
            deepseek: DeepSeek, gh_token: str | None) -> tuple[list[Item], list[Item]]:
    cutoff = (date.today() - timedelta(days=repeat_days)).isoformat()
    fresh = lambda r: seen.get(r.full_name, "") < cutoff  # noqa: E731

    # Общий тренд бывает коротким (10–25 репо), поэтому добавляем тренды по языкам.
    by_name: dict[str, Repo] = {}
    for lang in TRENDING_LANGUAGES:
        try:
            for repo in fetch_trending("daily", lang):
                by_name.setdefault(repo.full_name, repo)
        except Exception as e:
            log.warning("Не удалось получить тренды %r: %s", lang or "all", e)
    trending = sorted((r for r in by_name.values() if fresh(r)), key=lambda r: r.stars_gained, reverse=True)

    # Идём по трендам сверху вниз, DeepSeek сам решает, ИИ это или нет.
    # Если ИИ-раздел уже полон, ИИ-репо идёт в «Набирают популярность».
    ai: list[Item] = []
    hot: list[Item] = []
    for repo in trending:
        if len(ai) >= ai_count and len(hot) >= hot_count:
            break
        summary, is_ai = describe(repo, deepseek)
        (ai if is_ai and len(ai) < ai_count else hot).append((repo, summary))
    hot = hot[:hot_count]

    if len(ai) < ai_count:  # добираем свежими ИИ-репо из поиска
        names = {r.full_name for r in trending}
        for repo in fetch_new_ai_repos(token=gh_token):
            if len(ai) >= ai_count:
                break
            if fresh(repo) and repo.full_name not in names:
                ai.append((repo, describe(repo, deepseek)[0]))
    return ai, hot


def fmt_num(n: int) -> str:
    if n >= 1000:
        return f"{n / 1000:.1f}k".replace(".0k", "k")
    return str(n)


def render(i: int, repo: Repo, summary: str) -> str:
    meta = [f"⭐ {fmt_num(repo.stars)}"]
    if repo.stars_gained:
        meta[0] += f" (+{fmt_num(repo.stars_gained)} {repo.gained_label})"
    if repo.language:
        meta.append(html.escape(repo.language))
    return (
        f'{i}. <a href="{repo.url}"><b>{html.escape(repo.full_name)}</b></a>\n'
        f"{' · '.join(meta)}\n"
        f"{html.escape(summary)}"
    )


def build_digest(ai: list[Item], hot: list[Item]) -> list[str]:
    today = date.today()
    blocks = [f"<b>🔥 Репозитории дня — {today.day} {MONTHS[today.month - 1]}</b>"]
    for title, items in (("🤖 <b>ИИ</b>", ai), ("📈 <b>Набирают популярность</b>", hot)):
        if not items:
            continue
        blocks.append(title)
        blocks += [render(i, repo, summary) for i, (repo, summary) in enumerate(items, 1)]
    return blocks


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="напечатать дайджест вместо отправки")
    parser.add_argument("--no-send", action="store_true", help="сохранить выпуск в data/, не отправляя в Telegram")
    args = parser.parse_args()

    load_dotenv(BASE_DIR / ".env")
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    repeat_days = int(os.getenv("REPEAT_DAYS", "7"))
    deepseek = DeepSeek(os.environ["DEEPSEEK_API_KEY"], model=os.getenv("DEEPSEEK_MODEL", "deepseek-flash"))

    seen = load_seen()
    ai, hot = collect(
        seen,
        repeat_days,
        ai_count=int(os.getenv("AI_COUNT", "5")),
        hot_count=int(os.getenv("HOT_COUNT", "5")),
        deepseek=deepseek,
        gh_token=os.getenv("GITHUB_TOKEN") or None,
    )
    if not ai and not hot:
        log.info("Новых репозиториев нет — пропускаю.")
        return

    blocks = build_digest(ai, hot)

    if args.dry_run:
        print("\n\n".join(blocks))
        return

    if not args.no_send:
        Telegram(os.environ["TELEGRAM_BOT_TOKEN"], os.environ["TELEGRAM_CHAT_ID"]).send_blocks(blocks)
        log.info("Отправлено: %d ИИ + %d популярных (%s)", len(ai), len(hot), datetime.now().isoformat(timespec="seconds"))
    stamp = date.today().isoformat()
    seen.update({repo.full_name: stamp for repo, _ in ai + hot})
    save_seen(seen, repeat_days)

    log.info("Выпуск сохранён: %s", save_issue(DATA_DIR, {"ai": ai, "hot": hot}).relative_to(BASE_DIR))
    if os.getenv("GIT_PUSH") == "1":
        push_data(BASE_DIR)


if __name__ == "__main__":
    main()
