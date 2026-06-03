import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.feature_flags import flags
from app.core.security import AuthContext, get_current_user, require_admin, tenant_org_id
from app.models.schemas import DocumentResponse, IngestResponse
from app.services.document_service import DocumentService
from app.tasks.document_tasks import process_document_task

router = APIRouter()


@router.post("/ingest", status_code=202, response_model=IngestResponse)
async def ingest_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_admin),
    org_id: uuid.UUID | None = Depends(tenant_org_id),
):
    if not flags.DOCUMENT_UPLOAD_ENABLED:
        raise HTTPException(status_code=404, detail="Document upload is not enabled")

    suffix = (file.filename or "").lower()
    if not any(suffix.endswith(ext) for ext in [".pdf", ".docx", ".md", ".markdown", ".txt"]):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    service = DocumentService()
    document = await service.save_upload(
        db, file, user_id=auth.user_id, org_id=org_id or auth.org_id
    )
    process_document_task.delay(str(document.id))

    return IngestResponse(
        document_id=document.id,
        status=document.status,
        message="Document queued for background processing",
    )


@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(get_current_user),
    org_id: uuid.UUID | None = Depends(tenant_org_id),
):
    service = DocumentService()
    return await service.list_documents(db, org_id=org_id or auth.org_id)


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_admin),
    org_id: uuid.UUID | None = Depends(tenant_org_id),
):
    service = DocumentService()
    deleted = await service.delete_document(
        db,
        document_id,
        org_id=org_id or auth.org_id,
        user_id=auth.user_id,
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
