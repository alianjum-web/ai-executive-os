import json
import uuid

from fastapi import APIRouter, HTTPException, Request

from app.core.config import settings
from app.core.feature_flags import flags
from app.core.slack_dedupe import slack_event_dedupe
from app.core.slack_events import should_process_slack_message, slack_dedupe_key
from app.core.slack_verify import verify_slack_signature
from app.models.http.errors import SlackChallengeResponse, SlackWebhookAck
from app.models.http.slack import SlackEventCallbackPayload
from app.tasks.slack_tasks import enqueue_slack_event

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

    payload: SlackEventCallbackPayload = json.loads(body.decode("utf-8"))

    if payload.get("type") == "url_verification":
        challenge = payload.get("challenge") or ""
        return SlackChallengeResponse(challenge=challenge)

    if payload.get("type") == "event_callback":
        event = payload.get("event") or {}
        if should_process_slack_message(event):
            dedupe_key = slack_dedupe_key(payload, event)
            if await slack_event_dedupe.claim(dedupe_key):
                resolved_org: uuid.UUID | None = None
                if settings.default_org_id:
                    resolved_org = uuid.UUID(settings.default_org_id)
                enqueue_slack_event(
                    payload,
                    str(resolved_org) if resolved_org else None,
                )

    return SlackWebhookAck()
