import io
import logging
import re
from collections import defaultdict

import fitz
import pytesseract
from PIL import Image

from core.config import settings
from services.extraction.service import (
    ExtractedChapter,
    ExtractedSpecGridEntry,
    ExtractionResult,
    ExtractionService,
)

logger = logging.getLogger(__name__)

CHAPTER_PATTERN = re.compile(
    r"^(chapter|unit)\s+(\d+)[:\-\.]?\s*(.*)$", re.IGNORECASE)
OUTCOME_PATTERN = re.compile(
    r"(students will be able to|objectives?|outcomes?)", re.IGNORECASE
)
EXERCISE_PATTERN = re.compile(r"(exercise|practice|questions)", re.IGNORECASE)

QUESTION_TYPE_ALIASES = {
    "mcq": "mcq",
    "multiple choice": "mcq",
    "short": "short_answer",
    "short answer": "short_answer",
    "long": "long_answer",
    "long answer": "long_answer",
}

COGNITIVE_LEVEL_ALIASES = {
    "knowledge": "knowledge",
    "remember": "knowledge",
    "understanding": "understanding",
    "comprehension": "understanding",
    "application": "application",
    "higher": "higher_order",
    "analysis": "higher_order",
}


class RuleBasedExtractionService(ExtractionService):
    def extract_from_pdfs(self, documents: dict[str, bytes]) -> ExtractionResult:
        textbook_pages = self._extract_pages_text(
            documents.get("textbook", b""))
        teacher_pages = self._extract_pages_text(
            documents.get("teacher_guide", b""))
        curriculum_pages = self._extract_pages_text(
            documents.get("curriculum", b""))
        spec_grid_pages = self._extract_pages_text(
            documents.get("spec_grid", b""))

        document_texts = {
            "textbook": self._join_page_texts(textbook_pages),
            "teacher_guide": self._join_page_texts(teacher_pages),
            "curriculum": self._join_page_texts(curriculum_pages),
            "spec_grid": self._join_page_texts(spec_grid_pages),
        }

        chapter_titles = self._detect_chapters(textbook_pages)
        learning_outcomes = self._extract_learning_outcomes(curriculum_pages)
        exercises = self._extract_exercises(textbook_pages)
        diagrams = self._extract_diagrams(documents.get("textbook", b""))

        chapters: list[ExtractedChapter] = []
        for idx, (chapter_number, chapter_title) in enumerate(chapter_titles, start=1):
            chapter_outcomes = learning_outcomes.get(chapter_number, [])
            if not chapter_outcomes:
                chapter_outcomes = learning_outcomes.get(idx, [])

            chapter_text = self._collect_chapter_text(
                textbook_pages, chapter_number)
            chapter_teacher_notes = self._collect_chapter_text(
                teacher_pages, chapter_number)

            chapter_exercises = exercises.get(chapter_number, [])
            if chapter_exercises:
                chapter_text = f"{chapter_text}\n\nExercises:\n" + \
                    "\n".join(chapter_exercises)

            chapter_diagrams = diagrams.get(chapter_number, [])
            chapters.append(
                ExtractedChapter(
                    number=chapter_number,
                    title=chapter_title,
                    textbook_content=chapter_text.strip() or None,
                    teacher_notes=chapter_teacher_notes.strip() or None,
                    learning_outcomes=chapter_outcomes,
                    diagrams=chapter_diagrams,
                )
            )

        spec_entries = self._extract_spec_grid_entries(spec_grid_pages)

        return ExtractionResult(
            chapters=chapters,
            specification_grid_entries=spec_entries,
            document_texts=document_texts,
        )

    def gemini_extract(self, _: str) -> dict:
        return {
            "status": "not_implemented",
            "message": "Gemini extraction is intentionally disabled in Phase 2.",
        }

    def _extract_pages_text(self, pdf_bytes: bytes) -> list[tuple[int, str, list[dict]]]:
        if not pdf_bytes:
            return []

        page_results: list[tuple[int, str, list[dict]]] = []
        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            for page_index, page in enumerate(doc, start=1):
                text = page.get_text("text")
                text = text.strip()
                blocks = page.get_text("dict").get("blocks", [])

                if self._should_run_ocr(text):
                    ocr_text = self._run_ocr(page)
                    text = f"{text}\n{ocr_text}".strip()

                page_results.append((page_index, text, blocks))

        return page_results

    def _join_page_texts(self, pages: list[tuple[int, str, list[dict]]]) -> str:
        return "\n\n".join(
            page_text.strip() for _, page_text, _ in pages if page_text.strip()
        )

    def _should_run_ocr(self, text: str) -> bool:
        if not text:
            return True
        return len(text) < settings.extraction_text_threshold_chars_per_page

    def _run_ocr(self, page: fitz.Page) -> str:
        try:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            return pytesseract.image_to_string(img)
        except Exception as exc:  # noqa: BLE001
            logger.warning("OCR failed for page %s: %s", page.number + 1, exc)
            return ""

    def _detect_chapters(self, pages: list[tuple[int, str, list[dict]]]) -> list[tuple[int, str]]:
        chapters: list[tuple[int, str]] = []
        fallback_counter = 1

        for _, page_text, blocks in pages:
            for line in page_text.splitlines():
                stripped = line.strip()
                match = CHAPTER_PATTERN.match(stripped)
                if match:
                    number = int(match.group(2))
                    title = match.group(3).strip() or f"Chapter {number}"
                    candidate = (number, title)
                    if candidate not in chapters:
                        chapters.append(candidate)

            for block in blocks:
                if "lines" not in block:
                    continue
                for line in block.get("lines", []):
                    spans = line.get("spans", [])
                    if not spans:
                        continue
                    text = "".join(span.get("text", "")
                                   for span in spans).strip()
                    if not text:
                        continue
                    max_size = max(span.get("size", 0) for span in spans)
                    is_bold = any(span.get("flags", 0) & 16 for span in spans)
                    if max_size >= 14 and is_bold and len(text.split()) <= 10:
                        match = CHAPTER_PATTERN.match(text)
                        if match:
                            number = int(match.group(2))
                            title = match.group(
                                3).strip() or f"Chapter {number}"
                            candidate = (number, title)
                        else:
                            candidate = (fallback_counter, text)
                            fallback_counter += 1
                        if candidate not in chapters:
                            chapters.append(candidate)

        if not chapters:
            chapters = [(1, "Chapter 1")]

        chapters = sorted(chapters, key=lambda item: item[0])
        deduped: list[tuple[int, str]] = []
        seen_numbers: set[int] = set()
        for number, title in chapters:
            if number in seen_numbers:
                continue
            seen_numbers.add(number)
            deduped.append((number, title))
        return deduped

    def _extract_learning_outcomes(
        self, pages: list[tuple[int, str, list[dict]]]
    ) -> dict[int, list[str]]:
        outcomes_by_chapter: dict[int, list[str]] = defaultdict(list)
        current_chapter = 1

        for _, page_text, _ in pages:
            for line in page_text.splitlines():
                stripped = line.strip()
                chapter_match = CHAPTER_PATTERN.match(stripped)
                if chapter_match:
                    current_chapter = int(chapter_match.group(2))

                if OUTCOME_PATTERN.search(stripped):
                    outcomes_by_chapter[current_chapter].append(stripped)
                elif stripped.startswith(("-", "•")) and outcomes_by_chapter[current_chapter]:
                    outcomes_by_chapter[current_chapter].append(
                        stripped.lstrip("-• "))

        return outcomes_by_chapter

    def _extract_exercises(
        self, pages: list[tuple[int, str, list[dict]]]
    ) -> dict[int, list[str]]:
        exercises: dict[int, list[str]] = defaultdict(list)
        current_chapter = 1

        for _, page_text, _ in pages:
            for line in page_text.splitlines():
                stripped = line.strip()
                chapter_match = CHAPTER_PATTERN.match(stripped)
                if chapter_match:
                    current_chapter = int(chapter_match.group(2))

                if EXERCISE_PATTERN.search(stripped):
                    exercises[current_chapter].append(stripped)
                elif re.match(r"^(\d+|[a-zA-Z])\)|^(\d+|[a-zA-Z])[\.]", stripped):
                    if exercises[current_chapter]:
                        exercises[current_chapter].append(stripped)

        return exercises

    def _extract_diagrams(self, pdf_bytes: bytes) -> dict[int, list[dict]]:
        if not pdf_bytes:
            return defaultdict(list)

        diagrams_by_chapter: dict[int, list[dict]] = defaultdict(list)
        current_chapter = 1

        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            for page_index, page in enumerate(doc, start=1):
                text = page.get_text("text")
                for line in text.splitlines():
                    match = CHAPTER_PATTERN.match(line.strip())
                    if match:
                        current_chapter = int(match.group(2))
                        break

                images = page.get_images(full=True)
                for image_index, _ in enumerate(images, start=1):
                    caption = self._find_caption(text)
                    diagrams_by_chapter[current_chapter].append(
                        {
                            "page_number": page_index,
                            "caption": caption,
                            "diagram_type": self._classify_diagram(caption),
                            "index": image_index,
                        }
                    )

        return diagrams_by_chapter

    def _find_caption(self, page_text: str) -> str:
        for line in page_text.splitlines():
            lowered = line.lower()
            if any(token in lowered for token in ["figure", "fig", "map", "graph", "diagram"]):
                return line.strip()
        return "uncaptioned"

    def _classify_diagram(self, caption: str) -> str:
        lowered = caption.lower()
        if "map" in lowered:
            return "map"
        if "graph" in lowered:
            return "graph"
        if "geometry" in lowered:
            return "geometry"
        return "figure"

    def _extract_spec_grid_entries(
        self, pages: list[tuple[int, str, list[dict]]]
    ) -> list[ExtractedSpecGridEntry]:
        entries: list[ExtractedSpecGridEntry] = []

        for _, page_text, _ in pages:
            for line in page_text.splitlines():
                normalized = " ".join(line.split())
                if not normalized:
                    continue

                chapter_match = re.search(
                    r"chapter\s*(\d+)|unit\s*(\d+)", normalized, re.IGNORECASE)
                marks_match = re.search(
                    r"(\d+(?:\.\d+)?)\s*(marks?|m)", normalized, re.IGNORECASE)
                if not chapter_match or not marks_match:
                    continue

                chapter_number = int(chapter_match.group(
                    1) or chapter_match.group(2))
                marks = float(marks_match.group(1))

                question_type = self._normalize_question_type(normalized)
                cognitive_level = self._normalize_cognitive_level(normalized)

                entries.append(
                    ExtractedSpecGridEntry(
                        chapter_number=chapter_number,
                        question_type=question_type,
                        cognitive_level=cognitive_level,
                        marks_weightage=marks,
                    )
                )

        return entries

    def _normalize_question_type(self, text: str) -> str:
        lowered = text.lower()
        for key, value in QUESTION_TYPE_ALIASES.items():
            if key in lowered:
                return value
        return "short_answer"

    def _normalize_cognitive_level(self, text: str) -> str:
        lowered = text.lower()
        for key, value in COGNITIVE_LEVEL_ALIASES.items():
            if key in lowered:
                return value
        return "understanding"

    def _collect_chapter_text(
        self,
        pages: list[tuple[int, str, list[dict]]],
        chapter_number: int,
    ) -> str:
        if not pages:
            return ""

        collected: list[str] = []
        is_inside = False

        for _, page_text, _ in pages:
            lines = page_text.splitlines()
            for line in lines:
                stripped = line.strip()
                match = CHAPTER_PATTERN.match(stripped)
                if match:
                    current_number = int(match.group(2))
                    if current_number == chapter_number:
                        is_inside = True
                    elif is_inside:
                        return "\n".join(collected)

                if is_inside:
                    collected.append(stripped)

        return "\n".join(collected)
