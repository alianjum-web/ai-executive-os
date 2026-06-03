import json
import uuid
from email import policy
from email.parser import BytesParser

from fastapi import APIRouter, HTTPException, Request

from app.core.config import settings
from app.core.feature_flags import flags
from app.core.slack_verify import verify_slack_signature
from app.tasks.email_tasks import process_email_event_task
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


def _parse_sendgrid_inbound(form: dict) -> dict:
    subject = form.get("subject", "")
    from_email = form.get("from", form.get("sender", ""))
    text = form.get("text", "") or form.get("html", "")
    if not text and form.get("email"):
        try:
            msg = BytesParser(policy=policy.default).parsebytes(
                form["email"].encode() if isinstance(form["email"], str) else form["email"]
            )
            text = msg.get_body(preferencelist=("plain", "html"))
            text = text.get_content() if text else ""
        except Exception:
            text = str(form.get("email", ""))
    return {
        "source": "email",
        "from": from_email,
        "subject": subject,
        "body": text,
        "text": text,
    }


@router.post("/webhook/email")
async def email_webhook(request: Request):
    if not flags.EMAIL_WEBHOOK_ENABLED:
        raise HTTPException(status_code=404, detail="Email webhook is not enabled")
    if not flags.PROJECT_AGENT_ENABLED:
        raise HTTPException(status_code=404, detail="Project agent is not enabled")

    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        payload = _parse_sendgrid_inbound(dict(form))
    else:
        body = await request.json()
        payload = {
            "source": "email",
            "from": body.get("from", ""),
            "subject": body.get("subject", ""),
            "body": body.get("text", body.get("body", "")),
            "text": body.get("text", body.get("body", "")),
        }

    resolved_org: uuid.UUID | None = None
    if settings.default_org_id:
        resolved_org = uuid.UUID(settings.default_org_id)

    process_email_event_task.delay(
        payload,
        str(resolved_org) if resolved_org else None,
    )
    return {"ok": True}
