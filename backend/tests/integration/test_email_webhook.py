import json
import uuid
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures"
ORG_ID = str(uuid.uuid4())


@pytest.fixture(autouse=True)
def email_settings(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.default_org_id", ORG_ID)


@pytest.mark.asyncio
@patch("app.api.v1.routers.webhooks.process_email_event_task")
async def test_email_webhook_enqueues_celery(mock_task, client):
    mock_task.delay = MagicMock()
    payload = json.loads((FIXTURES / "sendgrid_inbound_email.json").read_text())
    response = await client.post("/api/v1/webhook/email", json=payload)
    assert response.status_code == 200
    assert response.json()["ok"] is True
    mock_task.delay.assert_called_once()
    args = mock_task.delay.call_args[0]
    assert args[0]["source"] == "email"
    assert args[0]["subject"] == payload["subject"]


@pytest.mark.asyncio
@patch("app.api.v1.routers.webhooks.process_email_event_task")
async def test_email_multipart_form_enqueues(mock_task, client):
    mock_task.delay = MagicMock()
    response = await client.post(
        "/api/v1/webhook/email",
        data={
            "from": "ops@company.com",
            "subject": "Server down",
            "text": "Production API is returning 503.",
        },
    )
    assert response.status_code == 200
    mock_task.delay.assert_called_once()
