import uuid
from dataclasses import dataclass


@dataclass
class AuthContext:
    user_id: uuid.UUID
    org_id: uuid.UUID
    role: str
    email: str | None = None
