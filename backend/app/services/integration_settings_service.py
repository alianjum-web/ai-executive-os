import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.encryption import decrypt_value, encrypt_value
from app.models.database import OrgIntegrationSettings


class IntegrationSettingsService:
    SENSITIVE_FIELDS = (
        "jira_client_id",
        "jira_client_secret",
        "jira_access_token",
        "jira_refresh_token",
        "sendgrid_api_key",
    )

    async def get_for_org(
        self, db: AsyncSession, org_id: uuid.UUID
    ) -> OrgIntegrationSettings | None:
        result = await db.execute(
            select(OrgIntegrationSettings).where(
                OrgIntegrationSettings.org_id == org_id
            )
        )
        return result.scalar_one_or_none()

    async def get_decrypted(self, db: AsyncSession, org_id: uuid.UUID) -> dict:
        row = await self.get_for_org(db, org_id)
        if not row:
            return {}
        return {
            "jira_site_url": row.jira_site_url,
            "jira_project_key": row.jira_project_key,
            "jira_client_id": decrypt_value(row.jira_client_id_encrypted or ""),
            "jira_client_secret": decrypt_value(row.jira_client_secret_encrypted or ""),
            "jira_access_token": decrypt_value(row.jira_access_token_encrypted or ""),
            "jira_refresh_token": decrypt_value(row.jira_refresh_token_encrypted or ""),
            "sendgrid_api_key": decrypt_value(row.sendgrid_api_key_encrypted or ""),
            "sendgrid_from_email": row.sendgrid_from_email,
            "inbound_email_address": row.inbound_email_address,
        }

    async def save_settings(
        self, db: AsyncSession, org_id: uuid.UUID, payload: dict
    ) -> OrgIntegrationSettings:
        row = await self.get_for_org(db, org_id)
        if not row:
            row = OrgIntegrationSettings(org_id=org_id)
            db.add(row)

        for field in (
            "jira_site_url",
            "jira_project_key",
            "sendgrid_from_email",
            "inbound_email_address",
        ):
            if field in payload:
                setattr(row, field, payload[field] or None)

        mapping = {
            "jira_client_id": "jira_client_id_encrypted",
            "jira_client_secret": "jira_client_secret_encrypted",
            "jira_access_token": "jira_access_token_encrypted",
            "jira_refresh_token": "jira_refresh_token_encrypted",
            "sendgrid_api_key": "sendgrid_api_key_encrypted",
        }
        for plain_field, enc_field in mapping.items():
            if plain_field in payload and payload[plain_field]:
                setattr(row, enc_field, encrypt_value(payload[plain_field]))

        await db.commit()
        await db.refresh(row)
        return row

    def to_public_dict(self, row: OrgIntegrationSettings | None) -> dict:
        if not row:
            return {
                "jira_site_url": None,
                "jira_project_key": None,
                "sendgrid_from_email": None,
                "inbound_email_address": None,
                "has_jira_credentials": False,
                "has_sendgrid_credentials": False,
            }
        return {
            "jira_site_url": row.jira_site_url,
            "jira_project_key": row.jira_project_key,
            "sendgrid_from_email": row.sendgrid_from_email,
            "inbound_email_address": row.inbound_email_address,
            "has_jira_credentials": bool(row.jira_access_token_encrypted),
            "has_sendgrid_credentials": bool(row.sendgrid_api_key_encrypted),
        }
