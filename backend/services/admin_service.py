from uuid import UUID

from sqlalchemy.orm import Session

from models.cdc_document import CDCDocument
from models.class_model import SchoolClass
from models.chapter import Chapter
from models.enums import CDCDocumentStatus, CDCDocumentType
from models.specification_grid_entry import SpecificationGridEntry
from models.subject import Subject


class AdminServiceError(Exception):
    pass


def create_class(db: Session, *, name: str) -> SchoolClass:
    school_class = SchoolClass(name=name.strip())
    db.add(school_class)
    db.commit()
    db.refresh(school_class)
    return school_class


def list_classes(db: Session) -> list[SchoolClass]:
    return db.query(SchoolClass).order_by(SchoolClass.name.asc()).all()


def create_subject(db: Session, *, class_id: UUID, name: str) -> Subject:
    school_class = db.query(SchoolClass).filter(
        SchoolClass.id == class_id).one_or_none()
    if not school_class:
        raise AdminServiceError("Class not found")

    subject = Subject(class_id=class_id, name=name.strip())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def list_subjects(db: Session) -> list[Subject]:
    return db.query(Subject).order_by(Subject.name.asc()).all()


def update_subject(db: Session, *, subject_id: UUID, name: str) -> Subject:
    subject = db.query(Subject).filter(Subject.id == subject_id).one_or_none()
    if not subject:
        raise AdminServiceError("Subject not found")
    subject.name = name.strip()
    db.commit()
    db.refresh(subject)
    return subject


def delete_subject(db: Session, *, subject_id: UUID) -> None:
    subject = db.query(Subject).filter(Subject.id == subject_id).one_or_none()
    if not subject:
        raise AdminServiceError("Subject not found")
    db.delete(subject)
    db.commit()


def get_subject(db: Session, *, subject_id: UUID) -> Subject | None:
    return db.query(Subject).filter(Subject.id == subject_id).one_or_none()


def get_document_by_subject_and_type(
    db: Session,
    *,
    subject_id: UUID,
    document_type: CDCDocumentType,
) -> CDCDocument | None:
    return (
        db.query(CDCDocument)
        .filter(CDCDocument.subject_id == subject_id, CDCDocument.type == document_type)
        .one_or_none()
    )


def list_documents_for_subject(db: Session, *, subject_id: UUID) -> list[CDCDocument]:
    return (
        db.query(CDCDocument)
        .filter(CDCDocument.subject_id == subject_id)
        .order_by(CDCDocument.created_at.asc())
        .all()
    )


def list_documents(db: Session, *, subject_id: UUID | None = None) -> list[CDCDocument]:
    query = db.query(CDCDocument)
    if subject_id:
        query = query.filter(CDCDocument.subject_id == subject_id)
    return query.order_by(CDCDocument.created_at.desc()).all()


def upsert_document(
    db: Session,
    *,
    subject_id: UUID,
    document_type: CDCDocumentType,
    file_url: str,
    existing: CDCDocument | None,
) -> CDCDocument:
    if existing:
        existing.file_url = file_url
        existing.status = CDCDocumentStatus.UPLOADED
        existing.extracted_text = None
        db.commit()
        db.refresh(existing)
        return existing

    document = CDCDocument(
        subject_id=subject_id,
        type=document_type,
        file_url=file_url,
        status=CDCDocumentStatus.UPLOADED,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def replace_subject_extraction(
    db: Session,
    *,
    subject_id: UUID,
    chapters: list[Chapter],
    spec_entries: list[SpecificationGridEntry],
) -> None:
    db.query(SpecificationGridEntry).filter(
        SpecificationGridEntry.subject_id == subject_id
    ).delete(synchronize_session=False)
    db.query(Chapter).filter(Chapter.subject_id ==
                             subject_id).delete(synchronize_session=False)

    for chapter in chapters:
        db.add(chapter)

    db.flush()

    for entry in spec_entries:
        db.add(entry)

    db.commit()


def list_chapters_for_review(db: Session, *, subject_id: UUID | None = None) -> list[Chapter]:
    query = db.query(Chapter)
    if subject_id:
        query = query.filter(Chapter.subject_id == subject_id)
    return query.order_by(Chapter.subject_id.asc(), Chapter.number.asc()).all()


def get_chapter(db: Session, *, chapter_id: UUID) -> Chapter | None:
    return db.query(Chapter).filter(Chapter.id == chapter_id).one_or_none()


def approve_chapters(db: Session, *, chapter_ids: list[UUID], approved: bool) -> int:
    updated_count = (
        db.query(Chapter)
        .filter(Chapter.id.in_(chapter_ids))
        .update({Chapter.approved: approved}, synchronize_session=False)
    )
    db.commit()
    return updated_count
