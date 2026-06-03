import asyncio
import uuid

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.agents.project_agent import ProjectAgent
from app.tasks.celery_app import celery_app


def _run_async(coro):
    return asyncio.run(coro)


@celery_app.task(name="process_slack_event")
def process_slack_event_task(payload: dict, org_id: str | None = None) -> str:
    async def _process():
        async with AsyncSessionLocal() as db:
            resolved_org = uuid.UUID(org_id) if org_id else None
            if not resolved_org and settings.default_org_id:
                resolved_org = uuid.UUID(settings.default_org_id)
            if not resolved_org:
                return "skipped:no_org"
            agent = ProjectAgent()
            ticket_id = await agent.run(db, resolved_org, payload)
            return str(ticket_id) if ticket_id else "skipped"

    return _run_async(_process())
