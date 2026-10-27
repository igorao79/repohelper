"""Архив выпусков в data/ — его читает сайт (web/)."""
import json
import logging
import subprocess
from dataclasses import asdict
from datetime import date, datetime
from pathlib import Path

from sources import Repo

log = logging.getLogger("repohelper")

SECTION_TITLES = {"ai": "ИИ", "hot": "Набирают популярность"}


def save_issue(data_dir: Path, sections: dict[str, list[tuple[Repo, str]]]) -> Path:
    """Пишет data/issues/<дата>.json и обновляет data/index.json (новые сверху)."""
    today = date.today().isoformat()
    issues_dir = data_dir / "issues"
    issues_dir.mkdir(parents=True, exist_ok=True)

    issue = {
        "date": today,
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "sections": [
            {
                "id": key,
                "title": SECTION_TITLES[key],
                "repos": [{**asdict(repo), "url": repo.url, "summary": summary} for repo, summary in items],
            }
            for key, items in sections.items()
            if items
        ],
    }
    path = issues_dir / f"{today}.json"
    path.write_text(json.dumps(issue, ensure_ascii=False, indent=2) + "\n")

    all_repos = [repo for items in sections.values() for repo, _ in items]
    lead = max(all_repos, key=lambda r: r.stars_gained) if all_repos else None
    entry = {
        "date": today,
        "count": len(all_repos),
        "ai_count": len(sections.get("ai", [])),
        "lead": lead.full_name if lead else None,
        "lead_gained": lead.stars_gained if lead else 0,
    }

    index_path = data_dir / "index.json"
    try:
        index = json.loads(index_path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        index = []
    index = [e for e in index if e["date"] != today]
    index.insert(0, entry)
    index.sort(key=lambda e: e["date"], reverse=True)
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")
    return path


def push_data(repo_dir: Path) -> None:
    """Коммитит и пушит data/ — сайт на Vercel подхватит новый выпуск."""
    def git(*args: str) -> subprocess.CompletedProcess:
        return subprocess.run(["git", "-C", str(repo_dir), *args], capture_output=True, text=True)

    git("add", "data")
    if git("diff", "--cached", "--quiet").returncode == 0:
        log.info("В data/ нет изменений — пушить нечего.")
        return
    git("commit", "-m", f"Выпуск {date.today().isoformat()}")
    for step in (("pull", "--rebase", "--autostash"), ("push",)):
        result = git(*step)
        if result.returncode != 0:
            log.error("git %s не прошёл: %s", step[0], result.stderr.strip())
            return
    log.info("data/ запушен в GitHub.")
