"""Отправка сообщений через Telegram Bot API."""
import requests

MAX_LEN = 4096


class Telegram:
    def __init__(self, token: str, chat_id: str):
        self.base = f"https://api.telegram.org/bot{token}"
        self.chat_id = chat_id

    def send(self, html: str) -> None:
        resp = requests.post(
            f"{self.base}/sendMessage",
            json={
                "chat_id": self.chat_id,
                "text": html,
                "parse_mode": "HTML",
                "link_preview_options": {"is_disabled": True},
            },
            timeout=30,
        )
        data = resp.json()
        if not data.get("ok"):
            raise RuntimeError(f"Telegram: {data.get('description')}")

    def send_blocks(self, blocks: list[str]) -> None:
        """Склеивает блоки в сообщения, не превышая лимит Telegram."""
        chunk = ""
        for block in blocks:
            if chunk and len(chunk) + len(block) + 2 > MAX_LEN:
                self.send(chunk)
                chunk = ""
            chunk = f"{chunk}\n\n{block}" if chunk else block
        if chunk:
            self.send(chunk)
