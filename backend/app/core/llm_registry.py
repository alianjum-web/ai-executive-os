"""Build chat/grading clients from features.json ai_provider + ai_models."""

from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings
from app.core.feature_registry import VALID_AI_PROVIDERS, get_ai_model_config, get_ai_provider

logger = logging.getLogger(__name__)

_API_KEY_FIELDS = {
    "openai": "openai_api_key",
    "anthropic": "anthropic_api_key",
    "gemini": "gemini_api_key",
    "groq": "groq_api_key",
}


def resolve_active_chat_provider_id() -> str:
    return get_ai_provider()


def get_active_plugin() -> dict[str, str]:
    pid = get_ai_provider()
    cfg = get_ai_model_config(pid)
    return {"id": pid, "label": cfg["name"], **cfg}


def list_provider_status() -> list[dict[str, Any]]:
    active = get_ai_provider()
    out: list[dict[str, Any]] = []
    for pid in sorted(VALID_AI_PROVIDERS):
        cfg = get_ai_model_config(pid)
        field = _API_KEY_FIELDS[pid]
        out.append(
            {
                "id": pid,
                "label": cfg["name"],
                "configured": bool(getattr(settings, field, "")),
                "active": pid == active,
                "chat_model": cfg["chat_model"],
            }
        )
    return out


def validate_active_provider() -> list[str]:
    errors: list[str] = []
    pid = get_ai_provider()
    field = _API_KEY_FIELDS.get(pid)
    if (
        settings.app_env.lower() in ("production", "prod")
        and field
        and not getattr(settings, field, "")
    ):
        env_key = {
            "openai": "OPENAI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "gemini": "GEMINI_API_KEY",
            "groq": "GROQ_API_KEY",
        }[pid]
        errors.append(f"{env_key} required for ai_provider={pid} in production")
    return errors


def build_llm_provider():
    from app.services.llm_providers import (
        AnthropicProvider,
        GeminiProvider,
        GroqProvider,
        OpenAIProvider,
    )

    pid = get_ai_provider()
    cfg = get_ai_model_config(pid)
    factories = {
        "openai": lambda: OpenAIProvider(model=cfg["chat_model"]),
        "anthropic": lambda: AnthropicProvider(model=cfg["chat_model"]),
        "gemini": lambda: GeminiProvider(model=cfg["chat_model"]),
        "groq": lambda: GroqProvider(model=cfg["chat_model"]),
    }
    return factories[pid]()


def build_grading_provider():
    from app.services.llm_providers import (
        AnthropicProvider,
        GeminiProvider,
        GroqProvider,
        OpenAIProvider,
    )

    pid = get_ai_provider()
    cfg = get_ai_model_config(pid)
    factories = {
        "openai": lambda: OpenAIProvider(model=cfg["grading_model"]),
        "anthropic": lambda: AnthropicProvider(model=cfg["grading_model"]),
        "gemini": lambda: GeminiProvider(model=cfg["grading_model"]),
        "groq": lambda: GroqProvider(model=cfg["grading_model"]),
    }
    return factories[pid]()
