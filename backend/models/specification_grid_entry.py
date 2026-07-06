import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class SpecificationGridEntry(Base):
    __tablename__ = "specification_grid_entry"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subject.id", ondelete="CASCADE"), nullable=False
    )
    chapter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chapter.id", ondelete="CASCADE"), nullable=False
    )
    question_type: Mapped[str] = mapped_column(String, nullable=False)
    cognitive_level: Mapped[str] = mapped_column(String, nullable=False)
    marks_weightage: Mapped[Decimal] = mapped_column(Numeric, nullable=False)

    subject: Mapped["Subject"] = relationship(
        "Subject", back_populates="specification_grid_entries"
    )
    chapter: Mapped["Chapter"] = relationship(
        "Chapter", back_populates="specification_grid_entries"
    )
