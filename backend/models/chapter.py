import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Chapter(Base):
    __tablename__ = "chapter"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subject.id", ondelete="CASCADE"), nullable=False
    )
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    learning_outcomes: Mapped[dict | list | None] = mapped_column(JSONB, nullable=True)
    textbook_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    teacher_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    diagrams: Mapped[dict | list | None] = mapped_column(JSONB, nullable=True)
    approved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    subject: Mapped["Subject"] = relationship("Subject", back_populates="chapters")
    specification_grid_entries: Mapped[list["SpecificationGridEntry"]] = relationship(
        "SpecificationGridEntry", back_populates="chapter", cascade="all, delete-orphan"
    )
    quiz_results: Mapped[list["QuizResult"]] = relationship(
        "QuizResult", back_populates="chapter", cascade="all, delete-orphan"
    )
