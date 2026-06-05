import uuid
from dataclasses import dataclass

from app.models.http.enums import UserRole


@dataclass
class AuthContext:
    user_id: uuid.UUID
    org_id: uuid.UUID
    role: UserRole
    email: str | None = None
