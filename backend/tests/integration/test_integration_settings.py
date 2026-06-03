import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.database import OrgIntegrationSettings

HEADERS = {
    "X-Org-Id": str(uuid.uuid4()),
    "X-User-Id": str(uuid.uuid4()),
    "X-User-Role": "admin",
}


@pytest.mark.asyncio
@patch("app.api.v1.routers.settings.IntegrationSettingsService")
async def test_get_integration_settings_masks_secrets(mock_service_cls, client):
    org_id = uuid.UUID(HEADERS["X-Org-Id"])
    row = OrgIntegrationSettings(
        org_id=org_id,
        jira_site_url="https://acme.atlassian.net",
        jira_project_key="ENG",
        jira_access_token_encrypted="enc-token",
        sendgrid_api_key_encrypted="enc-sg",
        sendgrid_from_email="noreply@acme.com",
        inbound_email_address="tickets@inbound.acme.com",
        updated_at=datetime.now(),
    )
    mock_service = mock_service_cls.return_value
    mock_service.get_for_org = AsyncMock(return_value=row)
    mock_service.to_public_dict.return_value = {
        "jira_site_url": "https://acme.atlassian.net",
        "jira_project_key": "ENG",
        "sendgrid_from_email": "noreply@acme.com",
        "inbound_email_address": "tickets@inbound.acme.com",
        "has_jira_credentials": True,
        "has_sendgrid_credentials": True,
    }

    response = await client.get("/api/v1/settings/integrations", headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["jira_site_url"] == "https://acme.atlassian.net"
    assert data["has_jira_credentials"] is True
    assert "jira_access_token" not in data
    assert "sendgrid_api_key" not in data


@pytest.mark.asyncio
@patch("app.api.v1.routers.settings.IntegrationSettingsService")
async def test_save_integration_settings_returns_public_view(mock_service_cls, client):
    org_id = uuid.UUID(HEADERS["X-Org-Id"])
    row = OrgIntegrationSettings(org_id=org_id, jira_project_key="ENG")
    mock_service = mock_service_cls.return_value
    mock_service.save_settings = AsyncMock(return_value=row)
    mock_service.to_public_dict.return_value = {
        "jira_site_url": "https://acme.atlassian.net",
        "jira_project_key": "ENG",
        "sendgrid_from_email": None,
        "inbound_email_address": None,
        "has_jira_credentials": True,
        "has_sendgrid_credentials": False,
    }

    response = await client.put(
        "/api/v1/settings/integrations",
        headers=HEADERS,
        json={
            "jira_site_url": "https://acme.atlassian.net",
            "jira_project_key": "ENG",
            "jira_access_token": "oauth-access-token",
        },
    )
    assert response.status_code == 200
    assert response.json()["jira_project_key"] == "ENG"
    mock_service.save_settings.assert_awaited_once()
