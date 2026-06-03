import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import ActivityLog


class ActivityLogService:
    async def log(
        self,
        db: AsyncSession,
        *,
        org_id: uuid.UUID | None,
        user_id: uuid.UUID | None,
        action: str,
        resource_type: str,
        resource_id: uuid.UUID | None = None,
    ) -> None:
        db.add(
            ActivityLog(
                org_id=org_id,
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
            )
        )
        await db.commit()
