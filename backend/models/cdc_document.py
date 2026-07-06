import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base
from models.enums import CDCDocumentStatus, CDCDocumentType


class CDCDocument(Base):
    __tablename__ = "cdc_document"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subject.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[CDCDocumentType] = mapped_column(
        Enum(CDCDocumentType, name="cdc_document_type"), nullable=False
    )
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[CDCDocumentStatus] = mapped_column(
        Enum(CDCDocumentStatus, name="cdc_document_status"),
        nullable=False,
        default=CDCDocumentStatus.UPLOADED,
        server_default=CDCDocumentStatus.UPLOADED.value,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    subject: Mapped["Subject"] = relationship("Subject", back_populates="cdc_documents")
