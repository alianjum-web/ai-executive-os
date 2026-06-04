from fastapi import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.responses import Response


def user_rate_limit_key(request: Request) -> str:
    user_id = request.headers.get("X-User-Id")
    if user_id:
        return f"user:{user_id}"
    return f"ip:{get_remote_address(request)}"


def org_rate_limit_key(request: Request) -> str:
    org_id = request.headers.get("X-Org-Id")
    if org_id:
        return f"org:{org_id}"
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=user_rate_limit_key)


def rate_limit_exceeded_handler(request: Request, exc: Exception) -> Response:
    """Typed wrapper for FastAPI; delegates to slowapi's handler."""
    if not isinstance(exc, RateLimitExceeded):
        raise exc
    return _rate_limit_exceeded_handler(request, exc)
