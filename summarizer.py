"""Краткие описания репозиториев через DeepSeek (OpenAI-совместимый API)."""
import json

import requests

from sources import Repo

SYSTEM_PROMPT = (
    "Ты редактор Telegram-канала про open source. По описанию и README репозитория верни JSON "
    '{"summary": "...", "is_ai": true|false}.\n'
    "summary — по-русски 1–2 коротких предложения (до 220 символов): что это и чем полезно разработчику. "
    "Без воды, без эмодзи, без markdown, без названия репозитория в начале, без фраз вроде «Этот репозиторий». "
    "Если README пустой — опирайся на описание. Ничего не выдумывай.\n"
    "is_ai — true, если проект про ИИ: LLM, агенты, нейросети, ML, инструменты и скиллы для ИИ-ассистентов."
)


class DeepSeek:
    def __init__(self, api_key: str, model: str = "deepseek-flash", base_url: str = "https://api.deepseek.com"):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")

    def summarize(self, repo: Repo, readme: str) -> tuple[str, bool]:
        user = (
            f"Репозиторий: {repo.full_name}\n"
            f"Язык: {repo.language or 'не указан'}\n"
            f"Описание: {repo.description or 'нет'}\n\n"
            f"README (фрагмент):\n{readme or 'нет'}"
        )
        resp = requests.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user},
                ],
                # без рассуждений: иначе они съедают max_tokens и ответ приходит пустым
                "thinking": {"type": "disabled"},
                "response_format": {"type": "json_object"},
                "temperature": 0.3,
                "max_tokens": 400,
            },
            timeout=120,
        )
        resp.raise_for_status()
        data = json.loads(resp.json()["choices"][0]["message"]["content"])
        summary = " ".join(str(data.get("summary", "")).split())
        if not summary:
            raise ValueError("пустой summary")
        return summary, bool(data.get("is_ai", repo.is_ai))
