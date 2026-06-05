"""Shared string enums for API and domain — keeps OpenAPI + pyright unambiguous."""

from typing import Literal

AiProviderId = Literal["openai", "anthropic", "gemini", "groq"]
UserRole = Literal["admin", "employee"]
DocumentStatus = Literal["pending", "processing", "ready", "error"]
TicketStatus = Literal["open", "in_progress", "resolved", "closed"]
TicketSource = Literal["slack", "manual", "api"]
