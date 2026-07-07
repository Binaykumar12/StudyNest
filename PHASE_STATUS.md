# AK Pathshala — Phase Status



Last updated: July 7, 2026



## Current Phase



**Phase 1 — Database Schema & Authentication** — **COMPLETE**



Database schema complete. Backend authentication (endpoints, bcrypt, JWT cookies, role middleware) complete. Frontend authentication (login/register, protected dashboard, logout) complete.



---



## Completed Tasks



### Phase 0 scaffold



- [x] Monorepo layout (`/frontend`, `/backend`, `/shared`)

- [x] Docker Compose for local dev (postgres + backend + frontend)

- [x] Backend folder structure (`/routes`, `/models`, `/schemas`, `/services`, `/db`, `/jobs`, `/core`)

- [x] Frontend folder structure (`/app`, `/components`, `/lib`, `/styles`)

- [x] `.env.example` files for frontend and backend

- [x] CORS configuration (backend allows `http://localhost:3000`)

- [x] Structured logging (backend)

- [x] Backend `/health` endpoint (no database check)

- [x] Frontend → backend health round-trip (`HealthStatus` component)

- [x] Root `README.md` with Docker and local setup steps

- [x] Product and architecture documentation in `/docs`



### Phase 0 fix (frontend startup)



- [x] Removed unsupported `frontend/next.config.ts`

- [x] Kept `frontend/next.config.mjs` as the sole Next.js config

- [x] Verified stack starts via `docker compose up --build`

- [x] Verified frontend at http://localhost:3000 (HTTP 200)

- [x] Verified backend at http://localhost:8000/health (`{"status":"ok","service":"ak-pathshala-api"}`)



### Phase 1 — Database Schema



- [x] SQLAlchemy configuration (`backend/db/base.py`, `backend/db/session.py`)

- [x] Database session dependency (`get_db`)

- [x] All 8 models: Class, Subject, CDCDocument, Chapter, SpecificationGridEntry, GeneratedContent, User, QuizResult

- [x] Enums & relationships

- [x] Alembic setup (`backend/alembic/`, `backend/alembic.ini`)

- [x] Initial migration (`001_initial_schema.py`)

- [x] PostgreSQL integration via `DATABASE_URL`

- [x] Migration verified against Docker Postgres



### Phase 1 — Backend Authentication



- [x] Auth endpoints: `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`

- [x] Password hashing with bcrypt

- [x] JWT access + refresh tokens (python-jose)

- [x] Tokens stored in httpOnly cookies (`access_token`, `refresh_token`)

- [x] JWT settings in `core/config.py` and `docker-compose.yml`

- [x] Pydantic request/response schemas (`schemas/auth.py`)

- [x] Auth service layer (`services/auth_service.py`)

- [x] Endpoints verified: register (201), duplicate email (409), login (200), bad credentials (401), refresh (200), logout (204)

- [x] **Bugfix**: `_clear_auth_cookies()` now matches cookie attributes (httponly, secure, samesite) for proper deletion

### Phase 1 — Role-Based Middleware

- [x] `backend/core/dependencies.py` — Three FastAPI dependencies:
  - `get_current_user()` — extracts and validates JWT from access_token cookie
  - `get_current_admin()` — validates current user has admin role (401 if not found, 403 if wrong role)
  - `get_current_student()` — validates current user has student role (401 if not found, 403 if wrong role)
- [x] Ready to use in protected routes: `@router.post("/admin-only", dependencies=[Depends(get_current_admin)])`



---



## Remaining Tasks



### Phase 1 — Database Schema & Authentication



1. ~~SQLAlchemy models + Alembic migrations~~ ✓

2. ~~Auth endpoints + password hashing + JWT cookies~~ ✓

3. ~~Role-based middleware: student vs admin route protection~~ ✓

4. ~~Frontend `/login` and `/register` pages (centered card layout, Tailwind)~~ ✓

5. ~~Protected route wrapper (redirect to `/login` if unauthenticated)~~ ✓



### Phase 2 — Admin Panel: CDC Upload + Extraction Pipeline



_Not started._



### Phase 3 — Student Dashboard: Browsing & Notes



_Not started._



### Phase 4 — AI Generators (Quiz, Test, Question Paper, PPT)



_Not started._



### Phase 5 — My Library, History & UI Polish



_Not started._



---



## Important Decisions



| Decision | Rationale |

|----------|-----------|

| **Next.js config uses `next.config.mjs`, not `.ts`** | Next.js 14.2.21 does not support `next.config.ts`; `.mjs` is the supported format |

| **JWT in httpOnly cookies** | Per architecture doc — avoids XSS token exposure; `SameSite=lax`, `secure` in production |

| **bcrypt directly (not passlib)** | passlib 1.7.4 is incompatible with bcrypt 4.1+; direct `bcrypt` library is simpler |

| **Enum `values_callable` on User.role** | PostgreSQL enum stores lowercase values (`student`); SQLAlchemy must serialize enum values, not names |

| **English-only generated output (V1)** | Per PRD non-goals; Nepali deferred to future version |

| **CDC documents as source of truth for AI** | RAG-grounded generation; no general knowledge unless sources insufficient |

| **Class 9 only for MVP** | Schema designed for future classes/subjects without structural changes |

| **Documentation in `/docs` is single source of truth** | Priority order defined in `.cursorrules` |



---



## Files Modified



### Phase 1 — Database Schema (prior session)



| Path | Purpose |

|------|---------|

| `backend/db/base.py` | SQLAlchemy declarative base |

| `backend/db/session.py` | Engine, SessionLocal, `get_db` |

| `backend/models/*.py` | All 8 ORM models + enums |

| `backend/alembic/` | Alembic env + initial migration |

| `backend/core/config.py` | `DATABASE_URL` setting |

| `docker-compose.yml` | `DATABASE_URL` for backend service |



### Phase 1 — Backend Authentication (this session)



| Path | Purpose |

|------|---------|

| `backend/requirements.txt` | Added `bcrypt`, `python-jose`, `email-validator` |

| `backend/core/config.py` | JWT secrets, expiry, cookie names |

| `backend/core/security.py` | bcrypt hashing, JWT create/decode |

| `backend/schemas/auth.py` | Register/Login request + User/Auth response schemas |

| `backend/services/auth_service.py` | Register, authenticate, lookup helpers |

| `backend/routes/auth.py` | Four auth endpoints with httpOnly cookie handling |

| `backend/main.py` | Mount auth router |

| `backend/models/user.py` | Fix enum serialization (`values_callable`) |

| `docker-compose.yml` | `JWT_SECRET`, `JWT_REFRESH_SECRET` env vars |

### Phase 1 — Frontend Authentication (this session)

| Path | Purpose |

|------|---------|

| `frontend/lib/api.ts` | Added auth API helpers with cookie credentials |

| `frontend/lib/withAuth.tsx` | Reusable protected-route auth wrapper |

| `frontend/middleware.ts` | Redirect unauthenticated dashboard access to `/login` |

| `frontend/app/login/page.tsx` | Login page with validation, loading, error handling |

| `frontend/app/register/page.tsx` | Register page with validation and password confirmation |

| `frontend/app/dashboard/page.tsx` | Protected dashboard showing user email/role and logout |

| `frontend/app/page.tsx` | Added home CTA links to login/register |



---



## Next Task



**Phase 2 — Admin Panel: CDC Upload + Extraction Pipeline**

Begin Phase 2 implementation after review approval of completed Phase 1 frontend authentication.

**Reference docs:**

1. `docs/02_Architecture.md`

2. `docs/10_BuildPhases.md`

