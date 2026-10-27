"""Сбор трендовых репозиториев с GitHub."""
import re
from dataclasses import dataclass, field
from datetime import date, timedelta

import requests
from bs4 import BeautifulSoup

UA = {"User-Agent": "repohelper-bot/1.0 (+https://github.com/igorao79/repohelper)"}

AI_KEYWORDS = re.compile(
    r"\b(ai|a\.i\.|llms?|gpt|agents?|agentic|claude|codex|gemini|deepseek|qwen|llama|mcp|rag|"
    r"openai|anthropic|chatbot|prompts?|copilot|diffusion|transformers?|embeddings?|"
    r"machine[- ]learning|deep[- ]learning|neural|inference|fine-?tun\w*|vlm|multimodal|"
    r"text-to-\w+|speech-to-text|tts|asr|stable[- ]diffusion|ollama|vllm|langchain|"
    r"skills?|harness|vibe[- ]coding)\b",
    re.IGNORECASE,
)

AI_TOPICS = ["ai", "llm", "ai-agents", "agents", "mcp", "generative-ai", "machine-learning", "rag"]


@dataclass
class Repo:
    full_name: str
    description: str = ""
    language: str = ""
    stars: int = 0
    stars_gained: int = 0  # за день (trending) или с момента создания (search)
    gained_label: str = "за день"
    topics: list[str] = field(default_factory=list)

    @property
    def url(self) -> str:
        return f"https://github.com/{self.full_name}"

    @property
    def is_ai(self) -> bool:
        text = " ".join([self.full_name.replace("-", " ").replace("_", " "), self.description, *self.topics])
        return bool(AI_KEYWORDS.search(text))


def _to_int(text: str) -> int:
    digits = re.sub(r"[^\d]", "", text or "")
    return int(digits) if digits else 0


def fetch_trending(since: str = "daily", language: str = "") -> list[Repo]:
    """Парсит github.com/trending — у GitHub нет официального API для трендов."""
    url = f"https://github.com/trending/{language}?since={since}"
    resp = requests.get(url, headers=UA, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    repos = []
    for row in soup.select("article.Box-row"):
        link = row.select_one("h2 a")
        if not link:
            continue
        full_name = link.get("href", "").strip("/")
        desc_el = row.select_one("p")
        lang_el = row.select_one('[itemprop="programmingLanguage"]')
        stars_el = row.select_one('a[href$="/stargazers"]')
        gained_el = row.find(string=re.compile(r"stars? (today|this week|this month)"))
        repos.append(
            Repo(
                full_name=full_name,
                description=desc_el.get_text(" ", strip=True) if desc_el else "",
                language=lang_el.get_text(strip=True) if lang_el else "",
                stars=_to_int(stars_el.get_text() if stars_el else ""),
                stars_gained=_to_int(gained_el.split("star")[0] if gained_el else ""),
            )
        )
    return repos


def fetch_new_ai_repos(days: int = 7, limit: int = 15, token: str | None = None) -> list[Repo]:
    """Свежие (созданные за `days` дней) ИИ-репозитории с наибольшим числом звёзд."""
    since = (date.today() - timedelta(days=days)).isoformat()
    headers = {**UA, "Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    found: dict[str, Repo] = {}
    # В одном запросе нельзя OR-ить топики, поэтому берём несколько самых крупных.
    for topic in AI_TOPICS[:4]:
        resp = requests.get(
            "https://api.github.com/search/repositories",
            params={"q": f"topic:{topic} created:>={since}", "sort": "stars", "order": "desc", "per_page": limit},
            headers=headers,
            timeout=30,
        )
        if resp.status_code != 200:
            continue  # rate limit без токена — не критично, тренды всё равно есть
        for item in resp.json().get("items", []):
            found[item["full_name"]] = Repo(
                full_name=item["full_name"],
                description=item.get("description") or "",
                language=item.get("language") or "",
                stars=item["stargazers_count"],
                stars_gained=item["stargazers_count"],
                gained_label="за неделю",
                topics=item.get("topics", []),
            )
    return sorted(found.values(), key=lambda r: r.stars, reverse=True)[:limit]


def fetch_readme(full_name: str, max_chars: int = 6000) -> str:
    for name in ("README.md", "readme.md", "README.rst", "README"):
        resp = requests.get(f"https://raw.githubusercontent.com/{full_name}/HEAD/{name}", headers=UA, timeout=20)
        if resp.status_code == 200 and resp.text.strip():
            text = re.sub(r"<[^>]+>", " ", resp.text)  # html-бейджи и картинки
            text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)
            text = re.sub(r"\n{3,}", "\n\n", text)
            return text[:max_chars]
    return ""
