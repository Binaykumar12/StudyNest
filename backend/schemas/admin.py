from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from models.enums import CDCDocumentStatus, CDCDocumentType


class SubjectCreateRequest(BaseModel):
    class_id: UUID
    name: str = Field(min_length=1, max_length=120)


class ClassCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class ClassResponse(BaseModel):
    id: UUID
    name: str

    model_config = {"from_attributes": True}


class SubjectUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class SubjectResponse(BaseModel):
    id: UUID
    class_id: UUID
    name: str

    model_config = {"from_attributes": True}


class DocumentUploadResponse(BaseModel):
    id: UUID
    subject_id: UUID
    type: CDCDocumentType
    file_url: str
    status: CDCDocumentStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentStatusResponse(BaseModel):
    subject_id: UUID
    total_documents: int
    uploaded_documents: int
    processing_documents: int
    processed_documents: int
    failed_documents: int
    ready_to_process: bool
    missing_document_types: list[CDCDocumentType]
    documents: list[DocumentUploadResponse]


class ProcessDocumentsRequest(BaseModel):
    subject_id: UUID


class ProcessDocumentsResponse(BaseModel):
    message: str
    subject_id: UUID


class ChapterReviewResponse(BaseModel):
    id: UUID
    subject_id: UUID
    number: int
    title: str
    approved: bool
    learning_outcomes: list[str] | None = None
    textbook_content: str | None = None
    teacher_notes: str | None = None
    diagrams: list[dict] | None = None

    model_config = {"from_attributes": True}


class ChapterEditRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class ChapterMergeRequest(BaseModel):
    source_chapter_id: UUID
    target_chapter_id: UUID


class ChapterApproveRequest(BaseModel):
    chapter_ids: list[UUID] = Field(min_length=1)
    approved: bool = True


class ChapterApproveResponse(BaseModel):
    updated_count: int


class AnalyticsResponse(BaseModel):
    total_subjects: int
    uploaded_documents: int
    processed_documents: int
    total_chapters: int
    active_users: int


class SpecificationGridEntryResponse(BaseModel):
    id: UUID
    subject_id: UUID
    chapter_id: UUID
    question_type: str
    cognitive_level: str
    marks_weightage: Decimal

    model_config = {"from_attributes": True}
