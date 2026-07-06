# UI/UX Design Specification
Nepal CDC AI Learning Platform — V1

---

## 1. Design Principles

- Minimal. Clean. Student-friendly.
- Clear typography hierarchy.
- Calm palette. No garish colors.
- Reference feel: Notion, Khan Academy.
- Mobile responsive throughout.

---

## 2. Navigation Map

```
Home
 └─ Login / Register
      └─ Student Dashboard
           ├─ Subjects
           │    └─ Chapters
           │         ├─ Notes
           │         ├─ MCQ Quiz
           │         ├─ Chapter Test
           │         ├─ Question Paper
           │         └─ PPT Generator
           ├─ My Library
           │    ├─ My Notes
           │    ├─ My PPTs
           │    ├─ My Papers
           │    ├─ My Tests
           │    └─ My Quiz Results
           └─ Profile / Settings
      └─ Admin Dashboard
           ├─ Subject Manager
           ├─ Upload Documents
           ├─ Processing Status
           ├─ Chapter Review
           ├─ User Management
           └─ Analytics
```

---

## 3. Page-by-Page Spec

### 3.1 Home
- Hero section. Platform value prop.
- CTA: Login / Register.
- Brief feature highlights (4 icons: Notes, Quiz, Papers, PPTs).

### 3.2 Login / Register
- Centered card layout.
- Fields: email, password.
- Toggle link between login/register.
- Error states inline, red text below field.

### 3.3 Student Dashboard
- Greeting header ("Welcome back, [name]").
- 5 subject cards, grid layout.
- Each card: subject name, chapter count, icon.
- Click → chapter list.

### 3.4 Subject → Chapter List
- Breadcrumb: Subjects > [Subject].
- List view. Each row: chapter number, title, short outcome preview.
- Click → chapter actions menu (Notes, Quiz, Test, Paper, PPT).

### 3.5 Chapter Notes
- Breadcrumb: Subjects > Subject > Chapter > Notes.
- Structured content: headings, subheadings, paragraphs.
- Sticky "Download PDF" button top-right.
- Reading-optimized width (max ~720px).

### 3.6 MCQ Quiz
**Setup screen**
- Select chapter, number of questions, difficulty.
- "Start Quiz" button.

**Quiz screen**
- One question at a time or scroll list (single-question recommended).
- Progress bar top.
- Options as selectable cards.

**Result screen**
- Score summary card.
- Time taken.
- Wrong-answer review list, expandable per question.
- Explanation shown per question.

### 3.7 Chapter Test Generator
- Select subject, chapters (multi-select), difficulty.
- "Generate Test" button.
- Result: printable test layout preview.
- Download PDF button.

### 3.8 Question Paper Generator
**Setup form**
- Subject dropdown.
- Chapter multi-select (with "select all").
- Paper type: Unit / Monthly / Final (radio).
- Total marks: 50 / 100 (radio).
- Difficulty: Easy / Medium / Hard / Mixed (radio).
- "Generate Paper" button.

**Loading state**
- Progress message: "Generating your question paper..."

**Result screen**
- Exam-style preview: subject, class, full marks, time allowed, 
  instructions, numbered questions, marks per question.
- Diagrams inline where required.
- Download PDF button.

### 3.9 PPT Generator
- Select chapter.
- "Generate PPT" button.
- Preview: slide list, title + bullets per slide.
- Download .pptx button.

### 3.10 My Library
- Tabs: Notes / PPTs / Papers / Tests / Quiz Results.
- Table or card list per tab.
- Each item: title, date, download icon, delete icon.
- Empty state per tab: message + CTA to generate.

### 3.11 Profile / Settings
- Email display.
- Change password form.
- Logout button.

### 3.12 Admin Dashboard
- Sidebar nav: Subjects, Upload, Review, Users, Analytics.
- Subject Manager: table + "Add Subject" modal.
- Upload page: 4 labeled drop zones (Curriculum, Textbook, Teacher 
  Guide, Spec Grid), per subject.
- Processing status: progress indicator, per-document state.
- Chapter Review: list with checkboxes, inline edit, approve button.
- User Management: table, disable toggle.
- Analytics: usage stats cards (active users, most-generated type).

---

## 4. Component Library

- Button (primary, secondary, destructive)
- Card
- Modal
- Dropdown / Select
- Multi-select (chips)
- Radio group
- File drop zone
- Progress bar
- Toast/notification
- Breadcrumb
- Tab bar
- Table
- Empty state block
- Loading skeleton

---

## 5. Interaction States

Every actionable component needs:
- Default
- Hover
- Active/pressed
- Disabled
- Loading
- Error

---

## 6. Responsive Rules

- Breakpoints: mobile (<640px), tablet (640–1024px), desktop (>1024px).
- Subject cards: 1 col mobile, 2 col tablet, 3+ col desktop.
- Admin tables: horizontal scroll on mobile.
- Forms: full-width fields on mobile.

---

## 7. Accessibility

- Color contrast AA minimum.
- Focus states visible on all inputs/buttons.
- Form errors announced via aria-live.
- Alt text for all diagram images.

---

## 8. Typography & Color (starting tokens)

- Font: Inter or similar sans-serif.
- Headings: bold, tight tracking.
- Body: 16px base, 1.6 line height.
- Primary color: calm blue/teal.
- Neutral grays for backgrounds/borders.
- Success/error/warning: standard semantic colors.
