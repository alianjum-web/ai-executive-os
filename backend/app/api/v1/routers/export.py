import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.feature_flags import flags
from app.core.security import AuthContext, require_admin, tenant_org_id
from app.services.export_service import ExportService

router = APIRouter()


@router.get("/export/queries.csv", response_class=PlainTextResponse)
async def export_queries_csv(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_admin),
    org_id: uuid.UUID | None = Depends(tenant_org_id),
):
    if not flags.ANALYTICS_DASHBOARD_ENABLED:
        raise HTTPException(status_code=404, detail="Export is not enabled")
    csv_data = await ExportService().export_queries_csv(db, org_id or auth.org_id)
    return PlainTextResponse(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=queries.csv"},
    )


@router.get("/export/tickets.csv", response_class=PlainTextResponse)
async def export_tickets_csv(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_admin),
    org_id: uuid.UUID | None = Depends(tenant_org_id),
):
    if not flags.ANALYTICS_DASHBOARD_ENABLED:
        raise HTTPException(status_code=404, detail="Export is not enabled")
    csv_data = await ExportService().export_tickets_csv(db, org_id or auth.org_id)
    return PlainTextResponse(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tickets.csv"},
    )
