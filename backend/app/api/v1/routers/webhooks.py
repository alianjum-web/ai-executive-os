import json
import uuid

from fastapi import APIRouter, HTTPException, Request

from app.core.config import settings
from app.core.feature_flags import flags
from app.core.slack_verify import verify_slack_signature
from app.tasks.slack_tasks import process_slack_event_task

router = APIRouter()


@router.post("/webhook/slack")
async def slack_webhook(request: Request):
    if not flags.SLACK_WEBHOOK_ENABLED:
        raise HTTPException(status_code=404, detail="Slack webhook is not enabled")
    if not flags.PROJECT_AGENT_ENABLED:
        raise HTTPException(status_code=404, detail="Project agent is not enabled")

    body = await request.body()
    verify_slack_signature(
        body,
        request.headers.get("X-Slack-Request-Timestamp"),
        request.headers.get("X-Slack-Signature"),
    )

    payload = json.loads(body.decode("utf-8"))

    if payload.get("type") == "url_verification":
        return {"challenge": payload.get("challenge")}

    if payload.get("type") == "event_callback":
        event = payload.get("event", {})
        if event.get("type") == "message" and not event.get("subtype"):
            resolved_org: uuid.UUID | None = None
            if settings.default_org_id:
                resolved_org = uuid.UUID(settings.default_org_id)
            process_slack_event_task.delay(
                payload,
                str(resolved_org) if resolved_org else None,
            )

    return {"ok": True}
