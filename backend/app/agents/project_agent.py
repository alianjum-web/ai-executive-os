import uuid
from typing import TypedDict

from langgraph.graph import END, StateGraph
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.assignee_service import AssigneeService
from app.services.intent_service import IntentService
from app.services.notification_service import NotificationService
from app.services.ticket_service import TicketService


class ProjectState(TypedDict, total=False):
    org_id: str
    raw_payload: dict
    message_text: str
    slack_channel_id: str | None
    slack_message_ts: str | None
    intent: str
    priority: int
    summary: str
    department: str


class ProjectAgent:
    def __init__(self) -> None:
        self.intent_service = IntentService()
        self.assignee_service = AssigneeService()
        self.ticket_service = TicketService()
        self.notifications = NotificationService()
        self.graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(ProjectState)
        workflow.add_node("parse_payload", self._parse_payload)
        workflow.add_node("classify_intent", self._classify_intent)
        workflow.add_node("determine_priority", self._determine_priority)
        workflow.add_node("assign_owner", self._assign_owner)
        workflow.add_node("create_ticket_record", self._create_ticket_record)
        workflow.add_node("send_notification", self._send_notification)
        workflow.set_entry_point("parse_payload")
        workflow.add_edge("parse_payload", "classify_intent")
        workflow.add_edge("classify_intent", "determine_priority")
        workflow.add_edge("determine_priority", "assign_owner")
        workflow.add_edge("assign_owner", "create_ticket_record")
        workflow.add_edge("create_ticket_record", "send_notification")
        workflow.add_edge("send_notification", END)
        return workflow.compile()

    async def _parse_payload(self, state: ProjectState) -> dict:
        payload = state.get("raw_payload", {})
        event = payload.get("event", payload)
        text = event.get("text", "") or ""
        if event.get("subtype") == "bot_message":
            text = ""
        return {
            "message_text": text.strip(),
            "slack_channel_id": event.get("channel"),
            "slack_message_ts": event.get("ts"),
        }

    async def _classify_intent(self, state: ProjectState) -> dict:
        text = state.get("message_text", "")
        if not text:
            return {
                "intent": "general",
                "priority": 1,
                "summary": "Empty message",
                "department": "support",
            }
        result = await self.intent_service.classify(text)
        return {
            "intent": result.intent,
            "priority": result.priority,
            "summary": result.summary,
            "department": result.department,
        }

    async def _determine_priority(self, state: ProjectState) -> dict:
        priority = state.get("priority", 3)
        return {"priority": max(1, min(5, int(priority)))}

    async def _assign_owner(self, state: ProjectState) -> dict:
        return {}

    async def _create_ticket_record(self, state: ProjectState) -> dict:
        return {}

    async def _send_notification(self, state: ProjectState) -> dict:
        return {}

    async def run(
        self,
        db: AsyncSession,
        org_id: uuid.UUID,
        raw_payload: dict,
    ) -> uuid.UUID | None:
        event = raw_payload.get("event", raw_payload)
        if event.get("bot_id") or event.get("subtype") == "bot_message":
            return None

        text = (event.get("text") or "").strip()
        if not text:
            return None

        parsed: ProjectState = await self.graph.ainvoke(
            {"org_id": str(org_id), "raw_payload": raw_payload}
        )

        await self.assignee_service.ensure_default_mappings(db, org_id)
        assignee = await self.assignee_service.assign_round_robin(
            db, org_id, parsed.get("department", "support")
        )

        ticket = await self.ticket_service.create_ticket_record(
            db,
            org_id=org_id,
            source="slack",
            raw_payload=raw_payload,
            intent=parsed.get("intent", "general"),
            priority=parsed.get("priority", 3),
            summary=parsed.get("summary", text[:200]),
            department=parsed.get("department", "support"),
            assignee_id=assignee.id if assignee else None,
            slack_channel_id=parsed.get("slack_channel_id"),
            slack_message_ts=parsed.get("slack_message_ts"),
        )

        if assignee:
            await self.notifications.notify_slack_dm(assignee, ticket)

        return ticket.id
