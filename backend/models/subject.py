import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Subject(Base):
    __tablename__ = "subject"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    class_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("class.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)

    school_class: Mapped["SchoolClass"] = relationship(
        "SchoolClass", back_populates="subjects"
    )
    cdc_documents: Mapped[list["CDCDocument"]] = relationship(
        "CDCDocument", back_populates="subject", cascade="all, delete-orphan"
    )
    chapters: Mapped[list["Chapter"]] = relationship(
        "Chapter", back_populates="subject", cascade="all, delete-orphan"
    )
    specification_grid_entries: Mapped[list["SpecificationGridEntry"]] = relationship(
        "SpecificationGridEntry", back_populates="subject", cascade="all, delete-orphan"
    )
