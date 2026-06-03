import uuid
from typing import TypedDict

from langgraph.graph import END, StateGraph
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.feature_flags import flags
from app.models.database import Ticket
from app.services.activity_log_service import ActivityLogService
from app.services.assignee_service import AssigneeService
from app.services.integration_settings_service import IntegrationSettingsService
from app.services.intent_service import IntentService
from app.services.jira_service import JiraService
from app.services.notification_service import NotificationService
from app.services.ticket_service import TicketService
from app.services.workload_service import WorkloadService


class ProjectState(TypedDict, total=False):
    org_id: str
    source: str
    raw_payload: dict
    message_text: str
    sender_email: str | None
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
        self.workload_service = WorkloadService()
        self.ticket_service = TicketService()
        self.notifications = NotificationService()
        self.activity = ActivityLogService()
        self.settings_service = IntegrationSettingsService()
        self.graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(ProjectState)
        workflow.add_node("parse_payload", self._parse_payload)
        workflow.add_node("classify_intent", self._classify_intent)
        workflow.add_node("determine_priority", self._determine_priority)
        workflow.set_entry_point("parse_payload")
        workflow.add_edge("parse_payload", "classify_intent")
        workflow.add_edge("classify_intent", "determine_priority")
        workflow.add_edge("determine_priority", END)
        return workflow.compile()

    async def _parse_payload(self, state: ProjectState) -> dict:
        payload = state.get("raw_payload", {})
        source = state.get("source", "slack")

        if source == "email":
            subject = payload.get("subject", "")
            body = payload.get("body", "") or payload.get("text", "")
            text = f"{subject}\n\n{body}".strip()
            return {
                "message_text": text,
                "sender_email": payload.get("from"),
                "slack_channel_id": None,
                "slack_message_ts": None,
            }

        event = payload.get("event", payload)
        text = event.get("text", "") or ""
        if event.get("subtype") == "bot_message":
            text = ""
        return {
            "message_text": text.strip(),
            "sender_email": None,
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

    def _detect_source(self, raw_payload: dict) -> str:
        if raw_payload.get("source") == "email":
            return "email"
        if "event" in raw_payload:
            return "slack"
        if raw_payload.get("from") and raw_payload.get("subject"):
            return "email"
        return "slack"

    async def run(
        self,
        db: AsyncSession,
        org_id: uuid.UUID,
        raw_payload: dict,
    ) -> uuid.UUID | None:
        source = self._detect_source(raw_payload)

        if source == "slack":
            event = raw_payload.get("event", raw_payload)
            if event.get("bot_id") or event.get("subtype") == "bot_message":
                return None
            if not (event.get("text") or "").strip():
                return None

        parsed: ProjectState = await self.graph.ainvoke(
            {
                "org_id": str(org_id),
                "source": source,
                "raw_payload": raw_payload,
            }
        )

        text = parsed.get("message_text", "").strip()
        if not text:
            return None

        integration = await self.settings_service.get_decrypted(db, org_id)
        jira = JiraService(integration)

        await self.assignee_service.ensure_default_mappings(db, org_id)
        assignee = await self.workload_service.pick_assignee_lowest_workload(
            db, org_id, parsed.get("department", "support"), jira
        )

        ticket = await self.ticket_service.create_ticket_record(
            db,
            org_id=org_id,
            source=source,
            raw_payload=raw_payload,
            intent=parsed.get("intent", "general"),
            priority=parsed.get("priority", 3),
            summary=parsed.get("summary", text[:200]),
            department=parsed.get("department", "support"),
            assignee_id=assignee.id if assignee else None,
            slack_channel_id=parsed.get("slack_channel_id"),
            slack_message_ts=parsed.get("slack_message_ts"),
        )

        if flags.AUDIT_LOG_ENABLED:
            await self.activity.log(
                db,
                org_id=org_id,
                user_id=assignee.id if assignee else None,
                action="ticket.created",
                resource_type="ticket",
                resource_id=ticket.id,
            )

        external_key = await self._create_jira_issue(
            db, org_id, ticket, parsed, text, jira
        )
        if external_key:
            from datetime import datetime, timezone

            ticket.external_ticket_id = external_key
            ticket.status = "synced"
            ticket.resolved_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(ticket)
            if flags.AUDIT_LOG_ENABLED:
                await self.activity.log(
                    db,
                    org_id=org_id,
                    user_id=assignee.id if assignee else None,
                    action="ticket.jira_created",
                    resource_type="ticket",
                    resource_id=ticket.id,
                )

        if assignee:
            if flags.AUDIT_LOG_ENABLED:
                await self.activity.log(
                    db,
                    org_id=org_id,
                    user_id=assignee.id,
                    action="ticket.assigned",
                    resource_type="ticket",
                    resource_id=ticket.id,
                )
            slack_ok = await self.notifications.notify_slack_dm(assignee, ticket)
            if not slack_ok:
                await self.notifications.notify_email(
                    assignee, ticket, integration, jira_site_url=integration.get("jira_site_url")
                )

        return ticket.id

    async def _create_jira_issue(
        self,
        db: AsyncSession,
        org_id: uuid.UUID,
        ticket: Ticket,
        parsed: ProjectState,
        text: str,
        jira: JiraService,
    ) -> str | None:
        if not jira.enabled:
            return None
        try:
            result = await jira.create_issue(
                summary=parsed.get("summary", "Incoming request")[:255],
                description=text,
                priority_name=jira.priority_label(parsed.get("priority", 3)),
            )
            return result.get("key")
        except Exception:
            return None
