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
            text = (
                f"*New ticket assigned*\n"
                f"*Summary:* {ticket.summary or 'No summary'}\n"
                f"*Intent:* {ticket.intent} | *Priority:* P{ticket.priority}\n"
                f"*Department:* {ticket.department}\n"
                f"*Ticket ID:* `{ticket.id}`\n"
                f"*Source:* {ticket.source}"
            )
            await client.chat_postMessage(channel=assignee.slack_user_id, text=text)
            return True
        except Exception:
            return False
