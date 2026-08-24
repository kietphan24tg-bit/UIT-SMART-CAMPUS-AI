from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .hashing import stable_hash


class EvaluationCache:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)

    def key(self, payload: dict[str, Any]) -> str:
        sanitized = {key: value for key, value in payload.items() if "secret" not in key.lower() and "token" not in key.lower()}
        return stable_hash(sanitized)

    def get(self, key: str) -> dict[str, Any] | None:
        path = self.root / f"{key}.json"
        if not path.exists():
            return None
        with path.open(encoding="utf-8") as file:
            return json.load(file)

    def set(self, key: str, value: dict[str, Any]) -> None:
        path = self.root / f"{key}.json"
        with path.open("w", encoding="utf-8") as file:
            json.dump(value, file, ensure_ascii=False, indent=2, sort_keys=True)
