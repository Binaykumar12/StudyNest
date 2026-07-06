# Acceptance Test Document
Nepal CDC AI Learning Platform

Pre-release checklist. Test every item.

---

## Authentication

- [ ] User can register.
- [ ] Duplicate email rejected.
- [ ] Invalid password rejected.
- [ ] Admin blocked from student-only pages.
- [ ] Student blocked from admin pages.
- [ ] Login works with correct credentials.
- [ ] Login fails with wrong credentials.
- [ ] Logout clears session.
- [ ] Token refresh works.

---

## CDC Upload

- [ ] All 4 PDFs upload successfully.
- [ ] 3 PDFs only → validation error shown.
- [ ] Corrupted PDF → error shown.
- [ ] OCR fallback triggers on scanned pages.
- [ ] Chapters detected correctly.
- [ ] Chapter review screen shows all chapters.
- [ ] Admin can edit chapter before approval.
- [ ] Approval makes chapters visible to students.

---

## Notes

- [ ] Notes match CDC textbook content.
- [ ] No invented content present.
- [ ] PDF download works.
- [ ] Formatting correct (headings, spacing).
- [ ] Notes load per chapter correctly.

---

## MCQ Quiz

- [ ] Quiz generates for selected chapter.
- [ ] Question count matches selection.
- [ ] Difficulty applied correctly.
- [ ] Score shown after submit.
- [ ] Explanations shown per question.
- [ ] Wrong-answer review works.
- [ ] Result saved to history.

---

## Chapter Test Generator

- [ ] Test generates for selected chapters.
- [ ] Difficulty applied correctly.
- [ ] PDF download works.
- [ ] Format matches CDC style.

---

## Question Paper Generator

- [ ] Total marks always equal selected value.
- [ ] Only selected chapters appear.
- [ ] Spec grid distribution respected.
- [ ] Cognitive levels balanced correctly.
- [ ] No duplicate questions.
- [ ] Diagrams appear when required.
- [ ] PDF formatting correct.
- [ ] Header fields correct (subject, class, marks, time).
- [ ] Validation Engine blocks invalid papers.

---

## PPT Generator

- [ ] PPT downloads successfully.
- [ ] Slide titles accurate.
- [ ] Bullets accurate, no invented content.
- [ ] No images present (V1 rule).

---

## My Library

- [ ] Generated content auto-saves.
- [ ] Notes tab shows saved notes.
- [ ] PPTs tab shows saved PPTs.
- [ ] Papers tab shows saved papers.
- [ ] Tests tab shows saved tests.
- [ ] Quiz Results tab shows history.
- [ ] Download works from library.
- [ ] Delete works from library.
- [ ] Empty state shows when no items.

---

## Admin

- [ ] Analytics page loads correctly.
- [ ] User management shows all users.
- [ ] Disable user works.
- [ ] New subject creation works.

---

## Cross-Cutting

- [ ] Mobile responsive on all pages.
- [ ] Loading states show during generation.
- [ ] Error toasts show on failure.
- [ ] No console errors on core pages.
- [ ] Security: no admin route accessible without role.
