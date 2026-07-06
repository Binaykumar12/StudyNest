# AK Pathshala

Nepal CDC AI-Powered Learning Platform — Class 9 MVP.

Monorepo scaffold for a full-stack web application:

- **Frontend** — Next.js 14, TypeScript, Tailwind CSS
- **Backend** — FastAPI (Python 3.11)
- **Database** — PostgreSQL (Docker service; wired in Phase 1)
- **Shared** — Reserved for future shared types and constants

## Project structure

```
/
├── backend/          FastAPI API service
├── frontend/         Next.js web app
├── shared/           Future shared types/constants (Phase 1+)
├── docs/             Product and architecture documentation
└── docker-compose.yml
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for Docker workflow), **or**
- Python 3.11+, Node.js 20+, and PostgreSQL 16 (for local workflow)

## Quick start (Docker)

1. Clone the repository and enter the project root.

2. Copy environment examples (optional for Phase 0; required from Phase 1):

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

3. Start all services:

   ```bash
   docker compose up --build
   ```

4. Open the app:

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend health: [http://localhost:8000/health](http://localhost:8000/health)
   - PostgreSQL: `localhost:5432` (user/db/password: `akpathshala`)

The home page calls the backend health endpoint and displays the response.

Hot reload is enabled for both frontend and backend via volume mounts.

## Local development (without Docker)

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

Backend runs at [http://localhost:8000](http://localhost:8000).

### Frontend

In a separate terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend runs at [http://localhost:3000](http://localhost:3000).

### PostgreSQL (optional in Phase 0)

PostgreSQL is included in Docker Compose for a complete local environment. The backend does **not** connect to the database until Phase 1. To run Postgres locally without Docker:

```bash
docker compose up postgres -d
```

## Phase 0 scope

This scaffold includes:

- Monorepo layout (`/frontend`, `/backend`, `/shared`)
- Docker Compose (frontend, backend, postgres)
- Backend `/health` endpoint (no database check)
- Frontend → backend health round-trip
- CORS, structured logging, `.env.example` files

Not included yet (later phases): authentication, database models, admin/student features, AI, PDF processing.

## Documentation

All product and architecture specs live in [`/docs`](./docs/). Start with:

1. [`docs/01_PRD.md`](./docs/01_PRD.md)
2. [`docs/02_Architecture.md`](./docs/02_Architecture.md)
3. [`docs/10_BuildPhases.md`](./docs/10_BuildPhases.md)

## License

Private — AK Pathshala.
