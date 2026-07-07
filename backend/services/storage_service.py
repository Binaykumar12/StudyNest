import logging
from datetime import UTC, datetime
from pathlib import Path

from supabase import Client, create_client

from core.config import settings

logger = logging.getLogger(__name__)


class StorageError(Exception):
    pass


class SupabaseStorageService:
    def __init__(self) -> None:
        self.bucket = settings.supabase_bucket_cdc_documents
        self._client: Client | None = None

    @property
    def client(self) -> Client:
        if self._client is None:
            if not settings.supabase_url or not settings.supabase_service_key:
                raise StorageError("Supabase credentials are not configured")
            self._client = create_client(
                settings.supabase_url, settings.supabase_service_key)
        return self._client

    def upload_pdf(self, subject_id: str, doc_type: str, file_name: str, content: bytes) -> str:
        sanitized_name = Path(file_name).name.replace(" ", "_")
        timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
        storage_path = f"{subject_id}/{doc_type}/{timestamp}_{sanitized_name}"

        logger.info("Upload started: subject=%s type=%s", subject_id, doc_type)
        try:
            self.client.storage.from_(self.bucket).upload(
                path=storage_path,
                file=content,
                file_options={
                    "content-type": "application/pdf", "upsert": "false"},
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception(
                "Upload failed for subject=%s type=%s", subject_id, doc_type)
            raise StorageError("Storage upload failed") from exc

        logger.info("Upload completed: subject=%s type=%s",
                    subject_id, doc_type)
        return f"supabase://{self.bucket}/{storage_path}"

    def delete_file(self, file_url: str) -> None:
        bucket, path = self._parse_supabase_url(file_url)
        try:
            self.client.storage.from_(bucket).remove([path])
        except Exception:  # noqa: BLE001
            logger.warning(
                "Failed to delete prior document from storage: %s", file_url)

    def download_file(self, file_url: str) -> bytes:
        bucket, path = self._parse_supabase_url(file_url)
        try:
            return self.client.storage.from_(bucket).download(path)
        except Exception as exc:  # noqa: BLE001
            raise StorageError("Failed to download file from storage") from exc

    @staticmethod
    def _parse_supabase_url(file_url: str) -> tuple[str, str]:
        prefix = "supabase://"
        if not file_url.startswith(prefix):
            raise StorageError("Unsupported storage url")
        remainder = file_url.removeprefix(prefix)
        if "/" not in remainder:
            raise StorageError("Invalid storage url")
        bucket, path = remainder.split("/", 1)
        return bucket, path
