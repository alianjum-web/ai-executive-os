from app.core.config import settings
from app.models.database import Ticket, User


class NotificationService:
    async def notify_slack_dm(
        self,
        assignee: User | None,
        ticket: Ticket,
    ) -> bool:
        if not assignee or not assignee.slack_user_id:
            return False
        if not settings.slack_bot_token:
            return False

        try:
            from slack_sdk.web.async_client import AsyncWebClient

            client = AsyncWebClient(token=settings.slack_bot_token)
            jira_line = ""
            if ticket.external_ticket_id:
                jira_line = f"\n*Jira:* {ticket.external_ticket_id}"
            text = (
                f"*New ticket assigned*\n"
                f"*Summary:* {ticket.summary or 'No summary'}\n"
                f"*Intent:* {ticket.intent} | *Priority:* P{ticket.priority}\n"
                f"*Department:* {ticket.department}\n"
                f"*Ticket ID:* `{ticket.id}`\n"
                f"*Source:* {ticket.source}{jira_line}"
            )
            await client.chat_postMessage(channel=assignee.slack_user_id, text=text)
            return True
        except Exception:
            return False

    async def notify_email(
        self,
        assignee: User | None,
        ticket: Ticket,
        integration: dict,
        *,
        jira_site_url: str | None = None,
    ) -> bool:
        if not assignee or not assignee.email:
            return False
        api_key = integration.get("sendgrid_api_key") or ""
        from_email = integration.get("sendgrid_from_email") or "noreply@example.com"
        if not api_key:
            return False

        jira_link = ""
        if ticket.external_ticket_id and jira_site_url:
            jira_link = (
                f'<p><a href="{jira_site_url.rstrip("/")}/browse/'
                f'{ticket.external_ticket_id}">{ticket.external_ticket_id}</a></p>'
            )

        html = f"""
        <h2>New ticket assigned</h2>
        <p><strong>Summary:</strong> {ticket.summary}</p>
        <p><strong>Intent:</strong> {ticket.intent} | <strong>Priority:</strong> P{ticket.priority}</p>
        <p><strong>Department:</strong> {ticket.department}</p>
        <p><strong>Source:</strong> {ticket.source}</p>
        {jira_link}
        """

        try:
            import httpx

            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "personalizations": [{"to": [{"email": assignee.email}]}],
                        "from": {"email": from_email},
                        "subject": f"[Ticket] {ticket.summary or 'New assignment'}",
                        "content": [{"type": "text/html", "value": html}],
                    },
                )
                return response.status_code in (200, 202)
        except Exception:
            return False
