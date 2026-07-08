import logging
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from db.session import SessionLocal
from models.chapter import Chapter
from models.enums import CDCDocumentStatus
from models.specification_grid_entry import SpecificationGridEntry
from services.admin_service import list_documents_for_subject, replace_subject_extraction
from services.extraction.rule_based_extraction import RuleBasedExtractionService
from services.storage_service import StorageError, SupabaseStorageService

logger = logging.getLogger(__name__)


class DocumentProcessingError(Exception):
    pass


class DocumentPipelineService:
    def __init__(self) -> None:
        self.storage = SupabaseStorageService()
        self.extractor = RuleBasedExtractionService()

    def process_subject_documents(self, subject_id: UUID) -> None:
        db: Session = SessionLocal()
        try:
            self._process_subject_documents(db, subject_id)
        finally:
            db.close()

    def _process_subject_documents(self, db: Session, subject_id: UUID) -> None:
        documents = list_documents_for_subject(db, subject_id=subject_id)
        if len(documents) < 4:
            raise DocumentProcessingError(
                "All four document types must be uploaded")

        logger.info("Processing started: subject=%s", subject_id)

        for document in documents:
            document.status = CDCDocumentStatus.PROCESSING
        db.commit()

        try:
            raw_documents: dict[str, bytes] = {}

            for document in documents:
                raw_pdf = self.storage.download_file(document.file_url)
                raw_documents[document.type.value] = raw_pdf

            extraction_result = self.extractor.extract_from_pdfs(raw_documents)

            chapters: list[Chapter] = []
            chapter_id_by_number: dict[int, UUID] = {}
            for item in extraction_result.chapters:
                chapter = Chapter(
                    subject_id=subject_id,
                    number=item.number,
                    title=item.title,
                    learning_outcomes=item.learning_outcomes,
                    textbook_content=item.textbook_content,
                    teacher_notes=item.teacher_notes,
                    diagrams=item.diagrams,
                    approved=False,
                )
                chapters.append(chapter)

            db.query(SpecificationGridEntry).filter(
                SpecificationGridEntry.subject_id == subject_id
            ).delete(synchronize_session=False)
            db.query(Chapter).filter(Chapter.subject_id == subject_id).delete(
                synchronize_session=False
            )
            db.flush()

            for chapter in chapters:
                db.add(chapter)
            db.flush()

            for chapter in chapters:
                chapter_id_by_number[chapter.number] = chapter.id

            spec_entries: list[SpecificationGridEntry] = []
            for entry in extraction_result.specification_grid_entries:
                chapter_id = chapter_id_by_number.get(entry.chapter_number)
                if not chapter_id:
                    continue
                spec_entries.append(
                    SpecificationGridEntry(
                        subject_id=subject_id,
                        chapter_id=chapter_id,
                        question_type=entry.question_type,
                        cognitive_level=entry.cognitive_level,
                        marks_weightage=Decimal(str(entry.marks_weightage)),
                    )
                )

            for entry in spec_entries:
                db.add(entry)

            for document in documents:
                document.extracted_text = extraction_result.document_texts.get(
                    document.type.value, ""
                )
                document.status = CDCDocumentStatus.PROCESSED

            db.commit()
            logger.info("Processing completed: subject=%s", subject_id)
        except (StorageError, ValueError, RuntimeError) as exc:
            db.rollback()
            logger.exception("Processing failed: subject=%s", subject_id)
            self._mark_failed(db, documents)
            raise DocumentProcessingError("Processing failed") from exc
        except Exception as exc:  # noqa: BLE001
            db.rollback()
            logger.exception("Processing failed: subject=%s", subject_id)
            self._mark_failed(db, documents)
            raise DocumentProcessingError("Processing failed") from exc

    def _mark_failed(self, db: Session, documents) -> None:
        for document in documents:
            document.status = CDCDocumentStatus.FAILED
        db.commit()
