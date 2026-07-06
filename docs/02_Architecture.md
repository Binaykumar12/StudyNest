# Software Architecture Document (SAD)
Nepal CDC AI Learning Platform — V1

---

## 1. System Overview

Three-tier architecture.

- Frontend: Next.js + Tailwind.
- Backend: FastAPI.
- Database: PostgreSQL.
- AI: Gemini API, RAG-grounded.
- Storage: Supabase Storage (PDFs, generated files).

Stateless backend. Horizontally scalable.

---

## 2. High-Level Architecture Diagram (textual)

```
[Next.js Frontend]
      |
      | REST (JWT auth)
      v
[FastAPI Backend]
   |     |         |
   |     |         v
   |     |     [Gemini API]
   |     v
   |  [Background Jobs]
   |  (extraction, generation)
   v
[PostgreSQL]  [Object Storage]
```

### 2.1 Content Pipeline (detailed)

```
PDF
 ↓
Extraction Engine
 ↓
Structured Database
 ↓
RAG Retrieval
 ↓
Validation Engine (pre-generation checks)
 ↓
Gemini
 ↓
Output Formatter
 ↓
PDF / PPT
```

Validation Engine checks:
- Marks total correctness.
- Question count vs spec grid.
- Spec grid compliance (types, cognitive levels, weightage).
- Chapter coverage (no extra, no missing).
- Duplicate question detection.
- Required diagrams present.

Runs after Gemini output, before Output Formatter.
Failed validation → regenerate or flag error. Never ship unvalidated output.

---

## 3. Database Schema

### 3.1 Entity Hierarchy

```
Class
 └─ Subject
     ├─ CDCDocument (curriculum/textbook/teacher_guide/spec_grid)
     └─ Chapter
         ├─ LearningOutcomes
         ├─ Exercises
         ├─ Diagrams
         └─ SpecificationGridEntry
```

### 3.2 Tables

**class**
| field | type |
|---|---|
| id | uuid, pk |
| name | text |
| created_at | timestamp |

**subject**
| field | type |
|---|---|
| id | uuid, pk |
| class_id | fk → class |
| name | text |

**cdc_document**
| field | type |
|---|---|
| id | uuid, pk |
| subject_id | fk → subject |
| type | enum(curriculum, textbook, teacher_guide, spec_grid) |
| file_url | text |
| extracted_text | text |
| status | enum(uploaded, processing, processed, failed) |
| created_at | timestamp |

**chapter**
| field | type |
|---|---|
| id | uuid, pk |
| subject_id | fk → subject |
| number | int |
| title | text |
| learning_outcomes | jsonb |
| textbook_content | text |
| teacher_notes | text |
| diagrams | jsonb |
| approved | boolean |

**specification_grid_entry**
| field | type |
|---|---|
| id | uuid, pk |
| subject_id | fk → subject |
| chapter_id | fk → chapter |
| question_type | text |
| cognitive_level | text |
| marks_weightage | numeric |

**generated_content**
| field | type |
|---|---|
| id | uuid, pk |
| user_id | fk → user |
| type | enum(notes, quiz, test, paper, ppt) |
| chapter_ids | uuid[] |
| params | jsonb |
| file_url | text |
| metadata | jsonb |
| created_at | timestamp |

**user**
| field | type |
|---|---|
| id | uuid, pk |
| email | text, unique |
| password_hash | text |
| role | enum(student, admin) |
| created_at | timestamp |

**quiz_result**
| field | type |
|---|---|
| id | uuid, pk |
| user_id | fk → user |
| chapter_id | fk → chapter |
| score | numeric |
| correct_answers | jsonb |
| wrong_answers | jsonb |
| time_taken | int |
| created_at | timestamp |

### 3.3 Design Rules

- No schema change for new class/subject.
- Diagrams stored as jsonb refs to object storage.
- Metadata field prevents duplicate questions.

---

## 4. API Design

### 4.1 Auth
```
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

### 4.2 Student
```
GET  /subjects
GET  /subjects/{id}/chapters
GET  /chapters/{id}/notes
POST /chapters/{id}/notes/download

POST /quiz/generate
POST /quiz/{id}/submit
GET  /quiz/history

POST /test/generate
POST /paper/generate
POST /ppt/generate

GET  /library
DELETE /library/{content_id}
```

### 4.3 Admin
```
POST /admin/subjects
POST /admin/documents/upload
POST /admin/documents/process
GET  /admin/chapters/review
POST /admin/chapters/approve
GET  /admin/users
PATCH /admin/users/{id}/disable
GET  /admin/analytics
```

### 4.4 Auth Rules

- JWT access + refresh tokens.
- httpOnly cookie storage.
- Role middleware: admin routes blocked for students.

---

## 5. Folder Structure

### Frontend
```
/frontend
 ├─ /app
 │   ├─ /login
 │   ├─ /dashboard
 │   ├─ /subjects/[id]/chapters
 │   ├─ /chapters/[id]/notes
 │   ├─ /quiz
 │   ├─ /test
 │   ├─ /paper
 │   ├─ /ppt
 │   ├─ /library
 │   ├─ /admin
 │   └─ /profile
 ├─ /components
 ├─ /lib
 └─ /styles
```

### Backend
```
/backend
 ├─ /routes
 ├─ /models
 ├─ /schemas
 ├─ /services
 │   ├─ extraction/
 │   ├─ generation/
 │   └─ rag/
 ├─ /db
 └─ /jobs
```

---

## 6. RAG Workflow

### 6.1 Ingestion Pipeline

```
1. Admin uploads 4 PDFs
2. Extract text (PyMuPDF) + OCR fallback
3. Detect chapter boundaries (heading rules + Gemini)
4. Split content per chapter
5. Extract learning outcomes, exercises, diagrams, spec grid rows
6. Store structured data in DB
7. Build searchable index (Postgres FTS or vector)
8. Admin review + approval
```

### 6.2 Generation Pipeline

```
1. User requests content (notes/quiz/test/paper/ppt)
2. Retrieve chapter data + spec grid entries
3. Order context: Curriculum → Textbook → Teacher Guide → Spec Grid
4. Check generated_content metadata to avoid duplicates
5. Call Gemini API with grounded context only
6. Run Validation Engine:
   - Marks total check
   - Question count check
   - Spec grid compliance check
   - Chapter coverage check
   - Duplicate detection
   - Diagram requirement check
7. If invalid: regenerate (max N retries) or flag for admin
8. Save to generated_content
9. Render PDF/PPTX (Output Formatter)
10. Return file to user
```

### 6.3 Grounding Rule

AI must not use general knowledge unless stored sources are insufficient.

---

## 7. Background Jobs

- Document processing: async task queue.
- Generation for large papers: async, poll or websocket status.
- Job states: queued, running, done, failed.

---

## 8. Non-Functional Architecture Notes

- Performance: generation target under a few seconds for typical requests.
- Scalability: stateless API, add subject via admin only.
- Security: role-based access, hashed passwords, signed file URLs.
- Data integrity: original PDFs retained as source of truth.

---

## 9. Tech Stack Summary

| Layer | Tech |
|---|---|
| Frontend | Next.js, Tailwind |
| Backend | FastAPI |
| DB | PostgreSQL |
| Auth | JWT |
| AI | Gemini API |
| PDF | PyMuPDF, pdfplumber, OCR |
| Search | Postgres FTS / vector |
| Storage | Supabase Storage |
