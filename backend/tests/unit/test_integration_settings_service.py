import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.encryption import decrypt_value
from app.models.database import OrgIntegrationSettings
from app.services.integration_settings_service import IntegrationSettingsService


@pytest.mark.asyncio
async def test_save_settings_encrypts_sensitive_fields():
    org_id = uuid.uuid4()
    row = OrgIntegrationSettings(org_id=org_id)
    db = AsyncMock()
    db.execute = AsyncMock(
        return_value=MagicMock(scalar_one_or_none=MagicMock(return_value=None))
    )
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock(side_effect=lambda r: r)

    service = IntegrationSettingsService()
    saved = await service.save_settings(
        db,
        org_id,
        {
            "jira_site_url": "https://test.atlassian.net",
            "jira_access_token": "secret-token-abc",
            "sendgrid_api_key": "SG.secret",
        },
    )

    assert saved.jira_access_token_encrypted
    assert saved.jira_access_token_encrypted != "secret-token-abc"
    assert decrypt_value(saved.jira_access_token_encrypted) == "secret-token-abc"
    assert decrypt_value(saved.sendgrid_api_key_encrypted) == "SG.secret"
