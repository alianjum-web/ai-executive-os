import uuid

import jwt
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth_context import AuthContext
from app.models.internal.coerce import as_user_role
from app.core.config import settings
from app.core.database import get_db
from app.core.feature_flags import flags
from app.core.supabase_jwt import decode_supabase_access_token
from app.core.tenant_sync import ensure_user_row


def _auth_from_headers(
    x_org_id: str | None,
    x_user_id: str | None,
    x_user_role: str | None,
) -> AuthContext | None:
    if not x_org_id or not x_user_id:
        return None
    role = as_user_role((x_user_role or "employee").lower())
    return AuthContext(
        user_id=uuid.UUID(x_user_id),
        org_id=uuid.UUID(x_org_id),
        role=role,
    )


async def get_current_user(
    authorization: str | None = Header(default=None),
    x_org_id: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> AuthContext:
    dev_auth = _auth_from_headers(x_org_id, x_user_id, x_user_role)
    if dev_auth and settings.is_development:
        await ensure_user_row(db, dev_auth)
        return dev_auth

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = decode_supabase_access_token(token)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        ) from exc

    user_metadata = payload.get("user_metadata") or {}
    app_metadata = payload.get("app_metadata") or {}
    org_raw = user_metadata.get("org_id") or app_metadata.get("org_id") or x_org_id
    role_raw = (
        user_metadata.get("role")
        or app_metadata.get("role")
        or x_user_role
        or "employee"
    ).lower()
    role = as_user_role(role_raw)
    sub = payload.get("sub") or x_user_id
    email = payload.get("email")

    if not org_raw or not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing org_id or user id",
        )

    auth = AuthContext(
        user_id=uuid.UUID(str(sub)),
        org_id=uuid.UUID(str(org_raw)),
        role=role,
        email=email,
    )
    await ensure_user_row(db, auth, metadata=user_metadata)
    return auth


def require_admin(auth: AuthContext = Depends(get_current_user)) -> AuthContext:
    if auth.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return auth


def tenant_org_id(
    auth: AuthContext = Depends(get_current_user),
) -> uuid.UUID | None:
    if flags.MULTI_TENANT_ENABLED:
        return auth.org_id
    return None
