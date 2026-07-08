import logging
from uuid import UUID

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.config import settings
from core.dependencies import get_current_admin
from db.session import get_db
from models.cdc_document import CDCDocument
from models.class_model import SchoolClass
from models.chapter import Chapter
from models.enums import CDCDocumentStatus, CDCDocumentType
from models.subject import Subject
from models.user import User
from schemas.admin import (
    AnalyticsResponse,
    ClassCreateRequest,
    ClassResponse,
    ChapterApproveRequest,
    ChapterApproveResponse,
    ChapterEditRequest,
    ChapterMergeRequest,
    ChapterReviewResponse,
    DocumentUploadResponse,
    DocumentStatusResponse,
    ProcessDocumentsRequest,
    ProcessDocumentsResponse,
    SubjectCreateRequest,
    SubjectResponse,
    SubjectUpdateRequest,
)
from services.admin_service import (
    AdminServiceError,
    approve_chapters,
    create_class,
    create_subject,
    delete_subject,
    get_chapter,
    get_document_by_subject_and_type,
    get_subject,
    list_documents,
    list_chapters_for_review,
    list_classes,
    list_subjects,
    upsert_document,
    update_subject,
)
from services.document_pipeline_service import DocumentPipelineService
from services.storage_service import StorageError, SupabaseStorageService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])
storage_service = SupabaseStorageService()
pipeline_service = DocumentPipelineService()


@router.post("/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject_endpoint(
    payload: SubjectCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> SubjectResponse:
    try:
        subject = create_subject(
            db, class_id=payload.class_id, name=payload.name)
    except AdminServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return SubjectResponse.model_validate(subject)


@router.post("/classes", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class_endpoint(
    payload: ClassCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> ClassResponse:
    school_class = create_class(db, name=payload.name)
    return ClassResponse.model_validate(school_class)


@router.get("/classes", response_model=list[ClassResponse])
def list_classes_endpoint(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[ClassResponse]:
    classes = list_classes(db)
    return [ClassResponse.model_validate(item) for item in classes]


@router.get("/subjects", response_model=list[SubjectResponse])
def list_subjects_endpoint(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[SubjectResponse]:
    subjects = list_subjects(db)
    return [SubjectResponse.model_validate(subject) for subject in subjects]


@router.put("/subjects/{subject_id}", response_model=SubjectResponse)
def update_subject_endpoint(
    subject_id: UUID,
    payload: SubjectUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> SubjectResponse:
    try:
        subject = update_subject(db, subject_id=subject_id, name=payload.name)
    except AdminServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return SubjectResponse.model_validate(subject)


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject_endpoint(
    subject_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> None:
    try:
        delete_subject(db, subject_id=subject_id)
    except AdminServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document_endpoint(
    subject_id: UUID = Form(...),
    document_type: CDCDocumentType = Form(...),
    replace_existing: bool = Form(False),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> DocumentUploadResponse:
    subject = get_subject(db, subject_id=subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid PDF")

    content = await file.read()
    if not content.startswith(b"%PDF"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid PDF")

    max_bytes = settings.max_pdf_upload_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.max_pdf_upload_size_mb}MB limit",
        )

    existing = get_document_by_subject_and_type(
        db,
        subject_id=subject_id,
        document_type=document_type,
    )
    if existing and not replace_existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate upload. Use replace_existing=true to replace.",
        )

    try:
        file_url = storage_service.upload_pdf(
            subject_id=str(subject_id),
            doc_type=document_type.value,
            file_name=file.filename or f"{document_type.value}.pdf",
            content=content,
        )
    except StorageError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Storage failure",
        ) from exc

    if existing:
        storage_service.delete_file(existing.file_url)

    document = upsert_document(
        db,
        subject_id=subject_id,
        document_type=document_type,
        file_url=file_url,
        existing=existing,
    )

    return DocumentUploadResponse.model_validate(document)


@router.get("/documents", response_model=list[DocumentUploadResponse])
def list_documents_endpoint(
    subject_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[DocumentUploadResponse]:
    documents = list_documents(db, subject_id=subject_id)
    return [DocumentUploadResponse.model_validate(document) for document in documents]


@router.get("/documents/status", response_model=DocumentStatusResponse)
def document_status_endpoint(
    subject_id: UUID = Query(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> DocumentStatusResponse:
    documents = list_documents(db, subject_id=subject_id)
    status_counts = {
        CDCDocumentStatus.UPLOADED: 0,
        CDCDocumentStatus.PROCESSING: 0,
        CDCDocumentStatus.PROCESSED: 0,
        CDCDocumentStatus.FAILED: 0,
    }

    for document in documents:
        status_counts[document.status] += 1

    required_types = {
        CDCDocumentType.CURRICULUM,
        CDCDocumentType.TEXTBOOK,
        CDCDocumentType.TEACHER_GUIDE,
        CDCDocumentType.SPEC_GRID,
    }
    uploaded_types = {document.type for document in documents}
    missing_document_types = sorted(
        required_types - uploaded_types,
        key=lambda item: item.value,
    )

    return DocumentStatusResponse(
        subject_id=subject_id,
        total_documents=len(documents),
        uploaded_documents=status_counts[CDCDocumentStatus.UPLOADED],
        processing_documents=status_counts[CDCDocumentStatus.PROCESSING],
        processed_documents=status_counts[CDCDocumentStatus.PROCESSED],
        failed_documents=status_counts[CDCDocumentStatus.FAILED],
        ready_to_process=not missing_document_types,
        missing_document_types=missing_document_types,
        documents=[DocumentUploadResponse.model_validate(
            document) for document in documents],
    )


@router.post("/documents/process", response_model=ProcessDocumentsResponse)
def process_documents_endpoint(
    payload: ProcessDocumentsRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> ProcessDocumentsResponse:
    subject = get_subject(db, subject_id=payload.subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    documents = (
        db.query(CDCDocument).filter(
            CDCDocument.subject_id == payload.subject_id).all()
    )
    uploaded_types = {document.type for document in documents}
    required_types = {
        CDCDocumentType.CURRICULUM,
        CDCDocumentType.TEXTBOOK,
        CDCDocumentType.TEACHER_GUIDE,
        CDCDocumentType.SPEC_GRID,
    }
    missing = required_types - uploaded_types
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing document",
        )

    background_tasks.add_task(
        pipeline_service.process_subject_documents,
        payload.subject_id,
    )

    logger.info("Processing started: subject=%s", payload.subject_id)

    return ProcessDocumentsResponse(
        message="Processing started",
        subject_id=payload.subject_id,
    )


@router.get("/chapters/review", response_model=list[ChapterReviewResponse])
def review_chapters_endpoint(
    subject_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[ChapterReviewResponse]:
    chapters = list_chapters_for_review(db, subject_id=subject_id)
    return [ChapterReviewResponse.model_validate(chapter) for chapter in chapters]


@router.put("/chapters/review/{chapter_id}", response_model=ChapterReviewResponse)
def edit_chapter_endpoint(
    chapter_id: UUID,
    payload: ChapterEditRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> ChapterReviewResponse:
    chapter = get_chapter(db, chapter_id=chapter_id)
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    chapter.title = payload.title.strip()
    db.commit()
    db.refresh(chapter)
    return ChapterReviewResponse.model_validate(chapter)


@router.post("/chapters/review/merge", response_model=ChapterReviewResponse)
def merge_chapters_endpoint(
    payload: ChapterMergeRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> ChapterReviewResponse:
    source = get_chapter(db, chapter_id=payload.source_chapter_id)
    target = get_chapter(db, chapter_id=payload.target_chapter_id)
    if not source or not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    if source.subject_id != target.subject_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chapters must belong to same subject",
        )

    source_text = source.textbook_content or ""
    target_text = target.textbook_content or ""
    target.textbook_content = "\n\n".join(
        text for text in [target_text, source_text] if text)

    source_outcomes = list(source.learning_outcomes or [])
    target_outcomes = list(target.learning_outcomes or [])
    target.learning_outcomes = list(
        dict.fromkeys(target_outcomes + source_outcomes))

    source_diagrams = list(source.diagrams or [])
    target_diagrams = list(target.diagrams or [])
    target.diagrams = target_diagrams + source_diagrams

    db.delete(source)
    db.commit()
    db.refresh(target)
    return ChapterReviewResponse.model_validate(target)


@router.delete("/chapters/review/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chapter_endpoint(
    chapter_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> None:
    chapter = get_chapter(db, chapter_id=chapter_id)
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    db.delete(chapter)
    db.commit()


@router.post("/chapters/approve", response_model=ChapterApproveResponse)
def approve_chapters_endpoint(
    payload: ChapterApproveRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> ChapterApproveResponse:
    updated_count = approve_chapters(
        db,
        chapter_ids=payload.chapter_ids,
        approved=payload.approved,
    )
    logger.info("Approval completed: chapters=%s", payload.chapter_ids)
    return ChapterApproveResponse(updated_count=updated_count)


@router.get("/analytics", response_model=AnalyticsResponse)
def admin_analytics_endpoint(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> AnalyticsResponse:
    total_subjects = db.query(func.count(Subject.id)).scalar() or 0
    uploaded_documents = (
        db.query(func.count(CDCDocument.id))
        .filter(CDCDocument.status.in_([CDCDocumentStatus.UPLOADED, CDCDocumentStatus.PROCESSING]))
        .scalar()
        or 0
    )
    processed_documents = (
        db.query(func.count(CDCDocument.id))
        .filter(CDCDocument.status == CDCDocumentStatus.PROCESSED)
        .scalar()
        or 0
    )
    total_chapters = db.query(func.count(Chapter.id)).scalar() or 0

    return AnalyticsResponse(
        total_subjects=total_subjects,
        uploaded_documents=uploaded_documents,
        processed_documents=processed_documents,
        total_chapters=total_chapters,
        active_users=0,
    )
