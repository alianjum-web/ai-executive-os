import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.feature_flags import flags
from app.core.security import AuthContext, require_admin, tenant_org_id
from app.services.integration_settings_service import IntegrationSettingsService

router = APIRouter()


class IntegrationSettingsUpdate(BaseModel):
    jira_site_url: str | None = None
    jira_project_key: str | None = None
    jira_client_id: str | None = None
    jira_client_secret: str | None = None
    jira_access_token: str | None = None
    jira_refresh_token: str | None = None
    sendgrid_api_key: str | None = None
    sendgrid_from_email: str | None = None
    inbound_email_address: str | None = None


class IntegrationSettingsPublic(BaseModel):
    jira_site_url: str | None = None
    jira_project_key: str | None = None
    sendgrid_from_email: str | None = None
    inbound_email_address: str | None = None
    has_jira_credentials: bool = False
    has_sendgrid_credentials: bool = False
    webhook_slack_url: str = "/api/v1/webhook/slack"
    webhook_email_url: str = "/api/v1/webhook/email"


@router.get("/settings/integrations", response_model=IntegrationSettingsPublic)
async def get_integration_settings(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_admin),
    org_id: uuid.UUID | None = Depends(tenant_org_id),
):
    service = IntegrationSettingsService()
    row = await service.get_for_org(db, org_id or auth.org_id)
    data = service.to_public_dict(row)
    return IntegrationSettingsPublic(**data)


@router.put("/settings/integrations", response_model=IntegrationSettingsPublic)
async def save_integration_settings(
    body: IntegrationSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_admin),
    org_id: uuid.UUID | None = Depends(tenant_org_id),
):
    service = IntegrationSettingsService()
    payload = body.model_dump(exclude_unset=True)
    row = await service.save_settings(db, org_id or auth.org_id, payload)
    return IntegrationSettingsPublic(**service.to_public_dict(row))
