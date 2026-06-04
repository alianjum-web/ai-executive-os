"""Sync Supabase JWT identity into Postgres organizations + users."""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth_context import AuthContext
from app.models.database import Organization, User


def _slugify(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return (base[:120] or "org") + f"-{uuid.uuid4().hex[:6]}"


async def ensure_organization_row(
    db: AsyncSession,
    org_id: uuid.UUID,
    *,
    org_name: str | None = None,
) -> None:
    name = (org_name or "Organization").strip() or "Organization"
    await db.execute(
        pg_insert(Organization)
        .values(
            id=org_id,
            name=name,
            slug=_slugify(name),
            plan="standard",
        )
        .on_conflict_do_nothing(index_elements=["id"])
    )

    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if org and org_name and org.name != org_name:
        org.name = org_name


async def ensure_user_row(
    db: AsyncSession,
    auth: AuthContext,
    metadata: dict | None = None,
) -> None:
    meta = metadata or {}
    await ensure_organization_row(
        db,
        auth.org_id,
        org_name=meta.get("org_name") if isinstance(meta.get("org_name"), str) else None,
    )
    await db.flush()

    now = datetime.now(timezone.utc)
    result = await db.execute(select(User).where(User.id == auth.user_id))
    user = result.scalar_one_or_none()

    full_name = meta.get("full_name")
    job_title = meta.get("job_title")

    if user:
        user.org_id = auth.org_id
        user.role = auth.role
        user.last_login_at = now
        if auth.email:
            user.email = auth.email
        if isinstance(full_name, str) and full_name.strip():
            user.full_name = full_name.strip()
        if isinstance(job_title, str) and job_title.strip():
            user.job_title = job_title.strip()
    else:
        await db.execute(
            pg_insert(User)
            .values(
                id=auth.user_id,
                email=auth.email or f"{auth.user_id}@local.dev",
                role=auth.role,
                org_id=auth.org_id,
                full_name=full_name.strip() if isinstance(full_name, str) else None,
                job_title=job_title.strip() if isinstance(job_title, str) else None,
                last_login_at=now,
            )
            .on_conflict_do_nothing(index_elements=["id"])
        )
        result = await db.execute(select(User).where(User.id == auth.user_id))
        user = result.scalar_one_or_none()
        if user:
            user.org_id = auth.org_id
            user.role = auth.role
            user.last_login_at = now
            if auth.email:
                user.email = auth.email
    await db.commit()
