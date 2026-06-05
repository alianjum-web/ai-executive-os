import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.feature_flags import flags
from app.core.security import AuthContext, require_admin, tenant_org_id
from app.models.http.schemas import AnalyticsDashboard
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/analytics/dashboard", response_model=AnalyticsDashboard)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_admin),
    org_id: uuid.UUID | None = Depends(tenant_org_id),
):
    if not flags.ANALYTICS_DASHBOARD_ENABLED:
        raise HTTPException(status_code=404, detail="Analytics dashboard is not enabled")

    service = AnalyticsService()
    metrics = await service.get_dashboard_metrics(db, org_id or auth.org_id)
    return AnalyticsDashboard(**metrics)
