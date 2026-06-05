import copy
import uuid
from typing import Any, TypedDict, cast

from langgraph.graph import END, StateGraph
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.slack_events import (
    extract_message_text,
    slack_message_ts_for_line,
    split_message_into_ticket_lines,
)
from app.models.http.slack import SlackEventCallbackPayload, SlackMessageEvent
from app.services.assignee_service import AssigneeService
from app.services.intent_service import IntentService
from app.services.notification_service import NotificationService
from app.services.ticket_service import TicketService


class ProjectState(TypedDict, total=False):
    org_id: str
    raw_payload: SlackEventCallbackPayload
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
        payload = state.get("raw_payload") or {}
        event: SlackMessageEvent = payload.get("event") or payload  # type: ignore[assignment]
        return {
            "message_text": extract_message_text(event),
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

    async def _create_ticket_for_line(
        self,
        db: AsyncSession,
        org_id: uuid.UUID,
        *,
        raw_payload: SlackEventCallbackPayload,
        line_text: str,
        channel_id: str | None,
        message_ts: str | None,
    ) -> uuid.UUID | None:
        existing = await self.ticket_service.find_by_slack_message(
            db,
            org_id,
            slack_channel_id=channel_id,
            slack_message_ts=message_ts,
        )
        if existing:
            return existing.id

        line_payload: SlackEventCallbackPayload = copy.deepcopy(raw_payload)
        line_event: SlackMessageEvent = dict(line_payload.get("event") or {})  # type: ignore[arg-type]
        line_event["text"] = line_text
        line_payload["event"] = line_event

        parsed = cast(
            ProjectState,
            await self.graph.ainvoke(
                {"org_id": str(org_id), "raw_payload": line_payload}
            ),
        )

        await self.assignee_service.ensure_default_mappings(db, org_id)
        assignee = await self.assignee_service.assign_round_robin(
            db, org_id, parsed.get("department", "support")
        )

        ticket = await self.ticket_service.create_ticket_record(
            db,
            org_id=org_id,
            source="slack",
            raw_payload=dict(line_payload),
            intent=parsed.get("intent", "general"),
            priority=parsed.get("priority", 3),
            summary=parsed.get("summary", line_text[:200]),
            department=parsed.get("department", "support"),
            assignee_id=assignee.id if assignee else None,
            slack_channel_id=channel_id,
            slack_message_ts=message_ts,
        )

        if assignee:
            await self.notifications.notify_slack_dm(assignee, ticket)

        return ticket.id

    async def run(
        self,
        db: AsyncSession,
        org_id: uuid.UUID,
        raw_payload: SlackEventCallbackPayload,
    ) -> uuid.UUID | None:
        event: SlackMessageEvent = raw_payload.get("event") or raw_payload  # type: ignore[assignment]
        if event.get("bot_id") or event.get("subtype") == "bot_message":
            return None

        text = extract_message_text(event)
        if not text:
            return None

        channel_id = event.get("channel")
        base_ts = event.get("ts")
        lines = split_message_into_ticket_lines(text)
        multi_line = len(lines) > 1

        first_id: uuid.UUID | None = None
        for index, line_text in enumerate(lines):
            line_ts = slack_message_ts_for_line(
                base_ts or "", index, multi_line=multi_line
            )
            ticket_id = await self._create_ticket_for_line(
                db,
                org_id,
                raw_payload=raw_payload,
                line_text=line_text,
                channel_id=channel_id,
                message_ts=line_ts,
            )
            if ticket_id and first_id is None:
                first_id = ticket_id

        return first_id
