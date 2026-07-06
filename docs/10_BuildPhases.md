# Nepal CDC Learning Platform — AI Build Prompts

Use with: Claude Code, Cursor, Bolt, v0, or Replit Agent.
Stack assumed: Next.js + Tailwind + FastAPI + PostgreSQL + Gemini API.
Feed one phase at a time. Don't skip ahead.

---

## Phase 0 — Project Setup & Architecture

```
Set up a full-stack web app scaffold:

Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS.
Backend: FastAPI (Python 3.11).
Database: PostgreSQL.
Auth: Email + password (JWT-based sessions).

Requirements:
- Monorepo structure: /frontend, /backend, /shared
- Docker Compose for local dev (postgres + backend + frontend)
- .env.example files for both frontend and backend
- Backend folder structure: /routes, /models, /schemas, /services, /db
- Frontend folder structure: /app, /components, /lib, /styles
- Set up CORS, health-check endpoint, basic logging
- Add README with setup steps

Do not add any business logic yet. Just scaffold + working "Hello World" 
round trip (frontend calls backend health endpoint and displays status).
```

---

## Phase 1 — Database Schema & Authentication

```
Design and implement the database schema for an education platform 
with this hierarchy:

Class → Subject → CDC Document (curriculum/textbook/teacher_guide/spec_grid) 
→ Chapter → (Learning Outcomes, Exercises, Diagrams)

Entities required (with fields):
- Class: id, name
- Subject: id, class_id, name
- CDCDocument: id, subject_id, type (enum), file_url, extracted_text
- Chapter: id, subject_id, number, title, learning_outcomes, 
  textbook_content, teacher_notes, diagrams (jsonb)
- SpecificationGridEntry: id, subject_id, chapter_id, question_type, 
  cognitive_level, marks_weightage
- GeneratedContent: id, user_id, type (notes/quiz/test/paper/ppt), 
  chapter_ids (array), params (jsonb), file_url, created_at
- User: id, email, password_hash, role (student/admin), created_at
- QuizResult: id, user_id, chapter_id, score, correct_answers, 
  wrong_answers, time_taken

Design this so a new Class or Subject can be added later with zero 
schema changes.

Build:
1. SQLAlchemy models + Alembic migrations for all entities above.
2. Auth endpoints: register, login, logout, refresh token.
3. Password hashing (bcrypt), JWT access + refresh tokens.
4. Role-based middleware: student vs admin route protection.
5. Frontend: /login and /register pages (clean, minimal, centered card 
   layout, Tailwind). Store JWT in httpOnly cookie.
6. Protected route wrapper on frontend that redirects to /login if 
   unauthenticated.

Do not build any content generation logic yet.
```

---

## Phase 2 — Admin Panel: CDC Upload + Extraction Pipeline

```
Build the admin content pipeline for an education platform.

Admin workflow:
1. Admin creates a Class + Subject entry (simple form).
2. Admin uploads 4 PDFs per subject: Curriculum, Textbook, Teacher Guide, 
   Specification Grid.
3. Admin clicks "Process" — system automatically:
   - Extracts raw text from each PDF (PyMuPDF, OCR fallback via pytesseract 
     if text extraction yields low content)
   - Detects chapter boundaries and titles using heading patterns + 
     Gemini API for ambiguous cases
   - Splits content chapter-by-chapter
   - Extracts learning outcomes, exercises, diagrams (image extraction), 
     and specification-grid rows (question type, cognitive level, marks)
   - Saves structured output to the database (Chapter, 
     SpecificationGridEntry tables)
4. Review screen: list all detected chapters with checkboxes, editable 
   title fields, and a text preview. Admin can edit/merge/delete before 
   approving.
5. On approval, chapters become visible to students.

Build:
1. Backend: /admin/subjects (CRUD), /admin/documents/upload, 
   /admin/documents/process (async job), /admin/chapters/review, 
   /admin/chapters/approve
2. Use a background task queue (FastAPI BackgroundTasks or Celery) for 
   processing — do not block the upload request.
3. Store original PDFs in object storage (Supabase Storage or S3-compatible), 
   keep extracted_text in DB alongside.
4. Frontend: /admin dashboard with:
   - Subject list + "Add Subject" modal
   - Per-subject upload page (4 file drop zones, labeled by document type)
   - "Process" button with progress/status indicator
   - Review screen with chapter list, checkboxes, inline edit, 
     Approve button
5. Basic admin analytics stub page (usage counts — can be placeholder 
   for now).
6. Restrict all /admin/* routes to role=admin.

Design: clean, functional, table-heavy admin UI. Not the priority to make 
beautiful — prioritize clarity and correctness of extracted data.
```

---

## Phase 3 — Student Dashboard: Browsing & Notes

```
Build the student-facing browsing experience.

Pages:
1. Student Dashboard (post-login home): shows 5 subjects for Class 9 
   as cards (Nepali, English, Mathematics, Science and Technology, 
   Social Studies). Each card links to that subject's chapter list.
2. Subject → Chapter list page: shows chapters in order, with number, 
   title, and a short description pulled from learning_outcomes.
3. Chapter Notes page: displays structured notes derived from 
   textbook_content — clean typography, headings for sub-topics, 
   readable paragraph spacing, a "Download as PDF" button.

Backend:
- GET /subjects (Class 9 only for V1)
- GET /subjects/{id}/chapters
- GET /chapters/{id}/notes — formats textbook_content + learning_outcomes 
  into structured notes JSON (may call Gemini API to clean/structure 
  raw extracted text into readable notes, grounded only in the stored 
  textbook_content — no invented content)
- POST /chapters/{id}/notes/download — generates PDF from notes and 
  returns file URL

Frontend:
- Design system: modern, minimal, student-friendly. Clear typography 
  hierarchy, generous whitespace, a calm color palette (avoid 
  garish colors — this is a study tool).
- Responsive: works cleanly on mobile and desktop.
- Breadcrumb navigation: Subjects > [Subject] > [Chapter] > Notes.

Use Tailwind. Reference a modern edtech aesthetic — think Notion or 
Khan Academy, not a generic AI chatbot look.
```

---

## Phase 4 — AI Generators (Quiz, Test, Question Paper, PPT)

```
Build the core AI generation features. All generation must be grounded 
in stored chapter data (RAG) — retrieve relevant chapter content, 
learning outcomes, teacher notes, and spec grid entries, then pass 
them to Gemini API as context. Do not let the model use general 
knowledge unless stored content is insufficient.

Content priority order for all generation: 
Curriculum → Textbook → Teacher Guide → Specification Grid.

### 4.1 MCQ Quiz
- User selects subject, chapter, number of questions, difficulty.
- Generate MCQs grounded in chapter content + spec grid.
- On submit: show score, correct answers, explanations, time taken, 
  wrong-answer review.
- Save result to QuizResult table.

### 4.2 Chapter-Wise Test Generator
- User selects subject, one or more chapters, difficulty.
- Generate a printable chapter test following CDC-style structure.
- Downloadable as PDF.

### 4.3 Question Paper Generator (flagship feature — build with most care)
User selects:
- Subject
- Chapter(s) — one, multiple, or all
- Paper Type: Unit Test / Monthly Test / Final Exam
- Total Marks: 50 or 100
- Difficulty: Easy / Medium / Hard / Mixed

Generation must:
- Combine all four CDC sources in priority order.
- Match total marks exactly.
- Cover only selected chapters.
- Follow specification grid's marks distribution, question types, 
  cognitive levels, chapter weightage.
- Balance knowledge / understanding / application / higher-order 
  questions.
- Avoid duplicate or near-duplicate questions — check against 
  previously generated questions for that chapter (query 
  GeneratedContent metadata).
- Include relevant diagrams/figures/maps from textbook or teacher 
  guide where a question requires them.
- Format as a professional printable exam: subject, class, full marks, 
  time allowed, instructions, numbered questions, correct mark 
  allocation per question.

Store per-question internal metadata (not shown to user): source 
chapter, related learning outcome(s), spec grid category, cognitive 
level, marks allocated, whether a diagram is required. Use this to 
prevent repetition on future generations.

### 4.4 PPT Generator
- Generates chapter presentation: slide titles + bullet points only 
  (no images in V1).
- Export as .pptx (use python-pptx on backend).

Build:
- Backend endpoints for each generator (async where generation takes 
  >2-3 seconds, with a status-polling or streaming response).
- Frontend: one clean generation page per feature, each with a 
  parameter selection form → "Generate" → result view → download button.
- PDF export for notes/tests/papers (use WeasyPrint or similar).
- PPTX export via python-pptx.

Prioritize correctness of the Question Paper Generator — it's the 
flagship feature. Test it against marks-total-matching and chapter 
-coverage before moving on.
```

---

## Phase 5 — My Library, History & UI Polish

```
Build the personal library and finish UI polish for launch.

### My Library
- Page with tabs: My Notes, My PPTs, My Question Papers, My Tests, 
  My Quiz Results.
- Each generated item auto-saves to GeneratedContent on creation — 
  wire this into all Phase 4 generators if not already done.
- Users can re-download or delete saved items.
- Quiz Results tab shows history list with score, date, chapter — 
  clicking opens the full review (correct/wrong answers, explanations).

### Downloads
- Confirm PDF download works for Notes and Question Papers.
- Confirm PPTX download works for Presentations.
- Quiz results: viewable in-app, no export required for V1.

### Profile / Settings
- Basic page: email, change password, logout.

### UI Polish Pass
- Consistent spacing, typography scale, and color usage across all 
  pages built in Phases 3-5.
- Add loading states for all generation actions (skeleton or spinner 
  with a status message like "Generating your question paper...").
- Add empty states (e.g. "No notes yet — generate your first one" 
  with a CTA button).
- Mobile responsiveness pass on every page.
- Basic error handling/toasts for failed generations or network errors.

### Site Map Check
Confirm all these routes exist and are reachable via navigation:
Home, Login/Register, Student Dashboard, Subjects → Chapters, 
Chapter Notes, MCQ Quiz, Chapter Test Generator, Question Paper 
Generator, PPT Generator, My Library, Admin Dashboard, 
Profile/Settings.

This is the final MVP polish phase — no new features, just 
completeness and quality of what's already built.
```

---

## Notes on sequencing

- Run phases in order. Each depends on the schema/auth from Phase 1.
- Phase 2 (admin pipeline) must work before Phase 3/4 have real data 
  to test against — consider seeding fake chapter data first if you 
  want to build Phase 3/4 in parallel.
- Phase 4.3 (Question Paper Generator) is the hardest — budget the 
  most iteration time there.
- Before starting each phase prompt, paste in the current file 
  structure / relevant existing code so the AI tool has context 
  instead of guessing.
