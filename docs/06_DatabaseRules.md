# Database Extraction Rules
Nepal CDC AI Learning Platform

---

## 1. Purpose

Defines extraction logic. Ensures consistency.
All AI tools must follow this. No exceptions.

---

## 2. Chapter Detection

Rules:
- Detect numbered headings. Pattern: "Chapter N", "Unit N".
- Fallback: bold/large-font text blocks.
- Fallback: Gemini classification on ambiguous headings.
- Store chapter number + title + start/end page.

Edge cases:
- Missing numbers → assign sequential order.
- Merged chapters → split by sub-heading pattern.
- Non-English headings → translate before matching.

---

## 3. Heading Recognition

Signals used:
- Font size larger than body text.
- Bold or all-caps styling.
- Preceding blank line.
- Matches known heading vocabulary (per subject).

Priority order:
1. Structural signals (font/style).
2. Positional signals (top of page, spacing).
3. Semantic signals (Gemini fallback).

---

## 4. Exercise Extraction

Rules:
- Detect keywords: "Exercise", "Practice", "Questions".
- Capture numbered/lettered sub-items.
- Preserve original numbering.
- Store as structured list, linked to chapter.

Edge cases:
- Exercises spanning multiple pages → merge by chapter ID.
- Answer keys present → store separately, tag "answer_key".

---

## 5. Diagram Extraction

Rules:
- Extract embedded images per page.
- Match image to nearest caption/label text.
- Store image + caption + page number.
- Tag diagram type: figure, map, graph, geometry.

Edge cases:
- No caption → tag "uncaptioned", flag for admin review.
- Low-resolution image → flag "quality_low".
- Diagram spans two pages → merge if bounding boxes align.

---

## 6. Learning Outcomes Identification

Rules:
- Detect from Curriculum document only.
- Match keywords: "students will be able to", "objectives", "outcomes".
- Extract as bullet list.
- Link each outcome to chapter number.

Edge cases:
- Outcomes not chapter-labeled → match by page proximity.
- Ambiguous mapping → flag for admin review.

---

## 7. Specification Grid Parsing

Rules:
- Detect tabular structure.
- Extract columns: chapter, question type, cognitive level, marks.
- Normalize question type vocabulary (short answer, long answer, MCQ, etc).
- Normalize cognitive level vocabulary (knowledge, understanding, 
  application, higher-order).

Edge cases:
- Table format varies by subject → use column-header matching, 
  not fixed position.
- Merged cells → expand values downward/rightward.
- Non-tabular grid → fallback to Gemini structured extraction.

---

## 8. Handling Format Variance

Rules:
- Do not assume fixed layout across subjects.
- Run format detection first: text-based, scanned, mixed.
- Apply subject-specific extraction profile if one exists.
- Log format type per document for debugging.

---

## 9. OCR Fallback Rules

Trigger OCR when:
- Extracted text below threshold (e.g. <50 chars/page average).
- Text extraction returns garbled characters.

OCR rules:
- Use OCR engine per page, not whole document.
- Store OCR confidence score.
- Flag pages below confidence threshold for manual review.
- Never silently accept low-confidence OCR text.

---

## 10. Validation Rules

Before admin review:
- Every chapter has number + title. No blanks.
- Every chapter has at least one learning outcome, or flagged.
- Every spec grid entry has valid chapter link.
- Every diagram has page number.
- No duplicate chapter numbers per subject.

Before student visibility:
- Admin approval required.
- All flagged items resolved or explicitly accepted.

---

## 11. Failure Handling

- Extraction failure → status "failed", error logged, admin notified.
- Partial extraction → status "partial", missing sections listed.
- Never auto-approve failed or partial extractions.
