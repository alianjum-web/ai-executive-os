from unittest.mock import patch

import pytest

from app.core.config import settings
from app.services.llm_providers import AnthropicProvider, OpenAIProvider, build_llm_provider


def test_build_llm_provider_defaults_to_openai():
    with patch.object(settings, "feature_custom_llm_provider_enabled", True):
        with patch.object(settings, "llm_provider", "openai"):
            provider = build_llm_provider()
    assert isinstance(provider, OpenAIProvider)


def test_build_llm_provider_anthropic_when_configured():
    with patch.object(settings, "feature_custom_llm_provider_enabled", True):
        with patch.object(settings, "llm_provider", "anthropic"):
            provider = build_llm_provider()
    assert isinstance(provider, AnthropicProvider)


@pytest.mark.asyncio
async def test_openai_fallback_without_key():
    with patch.object(settings, "openai_api_key", ""):
        provider = OpenAIProvider()
    answer = await provider.generate_answer("q", "")
    assert "don't" in answer.lower()
