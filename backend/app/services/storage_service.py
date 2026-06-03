import uuid
from pathlib import Path

from app.core.config import settings


class StorageService:
    """Step 1 storage: Supabase Storage when configured, else local UPLOAD_DIR."""

    def __init__(self) -> None:
        self._upload_root = Path(settings.upload_dir)

    @property
    def uses_supabase(self) -> bool:
        return bool(settings.supabase_url and settings.supabase_service_role_key)

    def save_bytes(
        self,
        content: bytes,
        *,
        document_id: uuid.UUID,
        filename: str,
    ) -> str:
        suffix = Path(filename or "upload.bin").suffix.lower()
        object_name = f"{document_id}{suffix}"

        if self.uses_supabase:
            bucket = settings.supabase_storage_bucket
            path = f"documents/{object_name}"
            self._upload_supabase(bucket, path, content, suffix)
            return f"supabase:{bucket}/{path}"

        self._upload_root.mkdir(parents=True, exist_ok=True)
        local_path = self._upload_root / object_name
        local_path.write_bytes(content)
        return str(local_path)

    def resolve_read_path(self, storage_path: str) -> Path:
        """Return a local path the worker can read (downloads Supabase objects to temp)."""
        if storage_path.startswith("supabase:"):
            return self._download_supabase_to_temp(storage_path)
        return Path(storage_path)

    def _upload_supabase(
        self, bucket: str, path: str, content: bytes, suffix: str
    ) -> None:
        from supabase import create_client

        client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
        content_type = {
            ".pdf": "application/pdf",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".md": "text/markdown",
            ".txt": "text/plain",
        }.get(suffix, "application/octet-stream")
        client.storage.from_(bucket).upload(
            path,
            content,
            file_options={"content-type": content_type, "upsert": "true"},
        )

    def _download_supabase_to_temp(self, storage_path: str) -> Path:
        from supabase import create_client

        # supabase:bucket/documents/{id}.pdf
        _, rest = storage_path.split(":", 1)
        bucket, object_path = rest.split("/", 1)
        client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
        data = client.storage.from_(bucket).download(object_path)
        temp_dir = self._upload_root / "_supabase_cache"
        temp_dir.mkdir(parents=True, exist_ok=True)
        local = temp_dir / Path(object_path).name
        local.write_bytes(data)
        return local
