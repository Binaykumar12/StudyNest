"""
Quick Reference: Using Role-Based Middleware Dependencies

Import the dependencies:
    from core.dependencies import (
        get_current_user,
        get_current_admin,
        get_current_student,
    )

---

Example 1: Student-Only Endpoint
    @router.post("/student/generate-notes")
    def generate_notes(
        request: GenerateNotesRequest,
        current_user: User = Depends(get_current_student),
        db: Session = Depends(get_db),
    ) -> dict:
        # Code here only runs if:
        # 1. User has valid access_token cookie
        # 2. User has STUDENT role
        # Response: 200 + notes
        # Error: 401 (no auth) or 403 (wrong role)

---

Example 2: Admin-Only Endpoint
    @router.post("/admin/upload-document")
    def upload_document(
        file: UploadFile,
        current_user: User = Depends(get_current_admin),
        db: Session = Depends(get_db),
    ) -> dict:
        # Code here only runs if:
        # 1. User has valid access_token cookie
        # 2. User has ADMIN role
        # Response: 200 + upload result
        # Error: 401 (no auth) or 403 (wrong role)

---

Example 3: Any Authenticated User
    @router.get("/user/profile")
    def get_profile(
        current_user: User = Depends(get_current_user),
    ) -> UserResponse:
        # Code here only runs if:
        # 1. User has valid access_token cookie
        # Response: 200 + user profile
        # Error: 401 (no auth)

---

Example 4: Accessing User Data in Route
    @router.get("/my-generated-content")
    def list_my_content(
        current_user: User = Depends(get_current_student),
        db: Session = Depends(get_db),
    ) -> list[GeneratedContentResponse]:
        # current_user is a User model instance
        # You can access: current_user.id, current_user.email, current_user.role
        user_content = db.query(GeneratedContent).filter(
            GeneratedContent.user_id == current_user.id
        ).all()
        return [GeneratedContentResponse.model_validate(item) for item in user_content]

---

Error Handling

GET /some-protected-endpoint (no cookies)
    401 Unauthorized
    {"detail": "Access token missing"}

GET /some-protected-endpoint (invalid token)
    401 Unauthorized
    {"detail": "Invalid or expired access token"}

GET /admin-only-endpoint (valid token, STUDENT role)
    403 Forbidden
    {"detail": "Admin role required"}

GET /student-only-endpoint (valid token, ADMIN role)
    403 Forbidden
    {"detail": "Student role required"}

---

Testing with curl

# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  -c cookies.txt

# Access protected endpoint (cookies.txt contains the access_token)
curl -X GET http://localhost:8000/user/profile \
  -b cookies.txt

# Logout (clears cookies)
curl -X POST http://localhost:8000/auth/logout \
  -b cookies.txt \
  -c cookies.txt

# Try to access after logout (should fail)
curl -X GET http://localhost:8000/user/profile \
  -b cookies.txt
  # 401: Access token missing

---

Implementation Checklist for Next AI (Phase 1 Steps 4-5)

Frontend Login Page (/app/login/page.tsx):
  - [ ] Email input field
  - [ ] Password input field
  - [ ] "Remember me" checkbox (optional)
  - [ ] Login button
  - [ ] Error message display
  - [ ] Link to /register
  - [ ] Form validation (email format, password length)
  - [ ] Loading state while submitting
  - [ ] On success: redirect to /dashboard
  - [ ] On error: display message, keep form visible
  - [ ] Tailwind styling (centered card, shadows, responsive)

Frontend Register Page (/app/register/page.tsx):
  - [ ] Email input field
  - [ ] Password input field
  - [ ] Confirm password field
  - [ ] Register button
  - [ ] Error message display
  - [ ] Link to /login
  - [ ] Form validation (email, password length, passwords match)
  - [ ] Loading state while submitting
  - [ ] On success: redirect to /dashboard
  - [ ] On error: display message, keep form visible
  - [ ] Tailwind styling (centered card, shadows, responsive)

Frontend Dashboard (/app/dashboard/page.tsx):
  - [ ] Protected route (check for access_token cookie)
  - [ ] Display "Welcome, {user.email}"
  - [ ] Logout button
  - [ ] Navigation menu (Admin panel if role=admin, Student options if role=student)
  - [ ] On logout: clear cookies, redirect to /login

Protected Route HOC (frontend/lib/withAuth.tsx):
  - [ ] Check for access_token cookie
  - [ ] Show loading component while checking
  - [ ] If not found: redirect to /login
  - [ ] If found: render wrapped component
  - [ ] Handle cookie expiry gracefully

API Client Update (frontend/lib/api.ts):
  - [ ] Add loginUser(email, password) function
  - [ ] Add registerUser(email, password) function
  - [ ] Add logoutUser() function
  - [ ] Add getCurrentUser() function
  - [ ] Add error handling (401 → redirect to /login)
"""
