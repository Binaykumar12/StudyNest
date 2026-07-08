from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ExtractedChapter:
    number: int
    title: str
    textbook_content: str | None
    teacher_notes: str | None
    learning_outcomes: list[str]
    diagrams: list[dict]


@dataclass
class ExtractedSpecGridEntry:
    chapter_number: int
    question_type: str
    cognitive_level: str
    marks_weightage: float


@dataclass
class ExtractionResult:
    chapters: list[ExtractedChapter]
    specification_grid_entries: list[ExtractedSpecGridEntry]
    document_texts: dict[str, str]


class ExtractionService(ABC):
    @abstractmethod
    def extract_from_pdfs(self, documents: dict[str, bytes]) -> ExtractionResult:
        """Run extraction pipeline from raw PDF bytes."""

    @abstractmethod
    def gemini_extract(self, _: str) -> dict:
        """Placeholder for Gemini-driven extraction integration in later phases."""
