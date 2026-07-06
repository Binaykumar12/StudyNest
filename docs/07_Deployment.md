# Deployment Guide
Nepal CDC AI Learning Platform

---

## 1. Local Setup

```
git clone <repo>
cd project

# backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# frontend
cd ../frontend
npm install
```

Run dev servers:
```
# backend
uvicorn main:app --reload

# frontend
npm run dev
```

---

## 2. Docker Setup

`docker-compose.yml` services:
- postgres
- backend
- frontend

Commands:
```
docker compose up --build
docker compose down
```

Volumes:
- Persist Postgres data.
- Mount backend code for hot reload in dev.

---

## 3. Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<random-secret>
JWT_REFRESH_SECRET=<random-secret>
GEMINI_API_KEY=<key>
SUPABASE_URL=<url>
SUPABASE_SERVICE_KEY=<key>
ENV=development
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Rules:
- Never commit `.env` files.
- Rotate secrets on any suspected leak.
- Separate keys per environment (dev/staging/prod).

---

## 4. Gemini API Key

- Generate from Google AI Studio.
- Store only in backend env. Never expose to frontend.
- Set usage quota alerts.
- Rotate key every 90 days minimum.

---

## 5. PostgreSQL Setup

- Provision managed Postgres (e.g. Supabase, Neon, RDS).
- Run Alembic migrations on deploy:
```
alembic upgrade head
```
- Enable daily automated backups.
- Restrict DB access to backend service IP only.

---

## 6. Supabase Storage

- Create bucket for CDC PDFs.
- Create bucket for generated files (PDF/PPTX).
- Set access: private, signed URLs only.
- Set expiry on signed URLs (e.g. 1 hour).

---

## 7. Deployment Process

### Backend
- Platform: Render, Railway, or Fly.io.
- Build from Dockerfile.
- Run migrations before starting server.
- Health check endpoint: `/health`.

### Frontend
- Platform: Vercel.
- Connect repo, set env vars.
- Auto-deploy on main branch push.

### Steps
```
1. Push to main branch.
2. CI runs tests.
3. Backend builds + deploys.
4. Run migrations.
5. Frontend builds + deploys.
6. Smoke test critical paths (login, generate paper).
```

---

## 8. Backup Strategy

- Database: daily automated snapshot. Retain 30 days.
- Storage buckets: versioning enabled.
- Before major migration: manual backup + tested restore.
- Backup restore tested quarterly.

---

## 9. Monitoring

- Backend logs: structured JSON, centralized (e.g. Logtail, Datadog).
- Error tracking: Sentry (frontend + backend).
- Uptime monitoring on `/health` endpoint.
- Alert on Gemini API failures or quota limits.

---

## 10. Rollback Plan

- Keep last 3 deploy versions available.
- DB migrations must be reversible where possible.
- On failure: rollback deploy first, restore DB backup only if 
  data corruption confirmed.
