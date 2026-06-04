"""Single config file: backend/config/features.json"""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.core.config import settings

_CONFIG_PATH = Path(__file__).resolve().parents[2] / "config" / "features.json"
VALID_AI_PROVIDERS = frozenset({"openai", "gemini", "groq", "anthropic"})

# Optional .env override: FEATURE_DOCUMENT_UPLOAD_ENABLED=false
_ENV_PREFIX = "FEATURE_"


@lru_cache
def _load() -> dict[str, Any]:
    with _CONFIG_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def _parse_bool(value: str | bool) -> bool:
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in ("1", "true", "yes", "on")


def is_enabled(name: str) -> bool:
    """Feature on/off — used by API routes and mirrors UI visibility."""
    env_key = f"{_ENV_PREFIX}{name}"
    if env_key in os.environ:
        return _parse_bool(os.environ[env_key])
    features = _load().get("features", {})
    return _parse_bool(features.get(name, False))


def get_ai_provider() -> str:
    """
    Which AI vendor runs chat + grading.
    Override: LLM_PROVIDER or AI_PROVIDER in .env
    """
    for env_name in ("LLM_PROVIDER", "AI_PROVIDER"):
        if env_name in os.environ:
            value = os.environ[env_name].strip().lower()
            if value in VALID_AI_PROVIDERS:
                return value
    if settings.llm_provider and settings.llm_provider.lower() in VALID_AI_PROVIDERS:
        return settings.llm_provider.lower()
    value = str(_load().get("ai_provider", "gemini")).strip().lower()
    return value if value in VALID_AI_PROVIDERS else "gemini"


def get_ai_model_config(provider: str | None = None) -> dict[str, str]:
    pid = (provider or get_ai_provider()).lower()
    models = _load().get("ai_models", {})
    if pid not in models:
        return {"name": pid, "chat_model": "", "grading_model": ""}
    raw = models[pid]
    return {
        "name": raw.get("name", pid),
        "chat_model": raw.get("chat_model", ""),
        "grading_model": raw.get("grading_model", ""),
    }


def get_public_config() -> dict[str, Any]:
    """Payload for GET /api/v1/config/features (frontend + documentation)."""
    features = _load().get("features", {})
    resolved = {name: is_enabled(name) for name in features}
    provider = get_ai_provider()
    model = get_ai_model_config(provider)
    return {
        "ai_provider": provider,
        "ai_model_name": model["name"],
        "ai_chat_model": model["chat_model"],
        "features": resolved,
    }


def clear_cache() -> None:
    _load.cache_clear()
