import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.agents.project_agent import ProjectAgent


@pytest.mark.asyncio
@patch("app.agents.project_agent.flags")
@patch("app.agents.project_agent.IntentService")
@patch("app.agents.project_agent.NotificationService")
@patch("app.agents.project_agent.JiraService")
@patch("app.agents.project_agent.IntegrationSettingsService")
@patch("app.agents.project_agent.WorkloadService")
@patch("app.agents.project_agent.TicketService")
@patch("app.agents.project_agent.ActivityLogService")
@patch("app.agents.project_agent.AssigneeService")
async def test_email_to_ticket_jira_and_notify(
    mock_assignee_cls,
    mock_activity_cls,
    mock_ticket_cls,
    mock_workload_cls,
    mock_settings_cls,
    mock_jira_cls,
    mock_notify_cls,
    mock_intent_cls,
    mock_flags,
):
    mock_flags.AUDIT_LOG_ENABLED = True
    mock_flags.JIRA_INTEGRATION_ENABLED = True
    intent_result = MagicMock()
    intent_result.intent = "billing"
    intent_result.priority = 4
    intent_result.summary = "Billing dispute"
    intent_result.department = "billing"
    mock_intent_cls.return_value.classify = AsyncMock(return_value=intent_result)
    org_id = uuid.uuid4()
    ticket_id = uuid.uuid4()
    assignee_id = uuid.uuid4()

    assignee = MagicMock()
    assignee.id = assignee_id
    assignee.email = "dev@acme.com"
    assignee.slack_user_id = None

    ticket = MagicMock()
    ticket.id = ticket_id
    ticket.summary = "Billing dispute"
    ticket.intent = "billing"
    ticket.priority = 4
    ticket.department = "billing"
    ticket.source = "email"
    ticket.external_ticket_id = None
    ticket.status = "assigned"

    mock_assignee_cls.return_value.ensure_default_mappings = AsyncMock()
    mock_workload_cls.return_value.pick_assignee_lowest_workload = AsyncMock(
        return_value=assignee
    )
    mock_settings_cls.return_value.get_decrypted = AsyncMock(
        return_value={
            "jira_site_url": "https://acme.atlassian.net",
            "jira_project_key": "ENG",
            "jira_access_token": "token",
        }
    )
    mock_ticket_cls.return_value.create_ticket_record = AsyncMock(return_value=ticket)
    mock_activity_cls.return_value.log = AsyncMock()
    mock_jira_cls.return_value.enabled = True
    mock_jira_cls.return_value.priority_label.return_value = "High"
    mock_jira_cls.return_value.create_issue = AsyncMock(
        return_value={"key": "ENG-124", "url": "https://acme.atlassian.net/browse/ENG-124"}
    )
    mock_notify_cls.return_value.notify_slack_dm = AsyncMock(return_value=False)
    mock_notify_cls.return_value.notify_email = AsyncMock(return_value=True)

    db = AsyncMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()

    agent = ProjectAgent()
    payload = {
        "source": "email",
        "from": "customer@example.com",
        "subject": "Billing dispute",
        "body": "Charged twice on invoice 8842",
    }
    result = await agent.run(db, org_id, payload)

    assert result == ticket_id
    mock_jira_cls.return_value.create_issue.assert_awaited_once()
    mock_notify_cls.return_value.notify_email.assert_awaited_once()
    assert ticket.external_ticket_id == "ENG-124"
