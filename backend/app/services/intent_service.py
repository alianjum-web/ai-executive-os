import json
import re

from app.services.llm_service import LLMService

INTENT_CATEGORIES = (
    "bug_report",
    "feature_request",
    "billing",
    "hr",
    "general",
)

DEPARTMENTS = ("engineering", "billing", "hr", "product", "support")


class IntentClassification:
    def __init__(
        self,
        intent: str,
        priority: int,
        summary: str,
        department: str,
    ) -> None:
        self.intent = intent
        self.priority = priority
        self.summary = summary
        self.department = department


class IntentService:
    def __init__(self) -> None:
        self.llm = LLMService()

    async def classify(self, message_text: str) -> IntentClassification:
        if self.llm.has_client:
            raw = await self.llm.generate_answer(
                "You classify support tickets. Reply with JSON only.",
                (
                    f"Classify this Slack message:\n{message_text}\n\n"
                    "Return JSON with keys: intent (one of "
                    f"{', '.join(INTENT_CATEGORIES)}), priority (1-5 integer), "
                    f"summary (one sentence), department (one of {', '.join(DEPARTMENTS)})."
                ),
            )
            parsed = self._parse_json(raw)
            if parsed:
                return self._from_dict(parsed)

        return self._heuristic_classify(message_text)

    def _parse_json(self, raw: str) -> dict | None:
        try:
            match = re.search(r"\{[^{}]+\}", raw, re.DOTALL)
            if match:
                return json.loads(match.group())
        except json.JSONDecodeError:
            pass
        return None

    def _from_dict(self, data: dict) -> IntentClassification:
        intent = str(data.get("intent", "general")).lower().replace(" ", "_")
        if intent not in INTENT_CATEGORIES:
            intent = "general"
        priority = int(data.get("priority", 3))
        priority = max(1, min(5, priority))
        summary = str(data.get("summary", ""))[:500] or "Incoming Slack request"
        department = str(data.get("department", "support")).lower()
        if department not in DEPARTMENTS:
            department = "support"
        return IntentClassification(intent, priority, summary, department)

    def _heuristic_classify(self, text: str) -> IntentClassification:
        lower = text.lower()
        if any(w in lower for w in ("bill", "invoice", "payment", "charge", "refund", "billing")):
            return IntentClassification("billing", 4, text[:200], "billing")
        if any(w in lower for w in ("bug", "broken", "error", "crash")):
            return IntentClassification("bug_report", 4, text[:200], "engineering")
        if any(w in lower for w in ("feature", "request", "add", "enhancement")):
            return IntentClassification("feature_request", 3, text[:200], "product")
        if any(w in lower for w in ("pto", "hr", "leave", "hiring", "onboard")):
            return IntentClassification("hr", 3, text[:200], "hr")
        return IntentClassification("general", 2, text[:200], "support")
