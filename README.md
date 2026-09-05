# Video Learning + Interactive Quiz Platform

Mini learning platform where admins create video-based content with timestamp-based questions, and learners watch videos with interactive quizzes.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** NestJS, MongoDB, JWT
- **Database:** MongoDB

## Prerequisites

**Option A — Docker (recommended for reviewers)**  
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and **running**  
- Confirm in a terminal:

```bash
docker --version
docker compose version
```

If either command fails with `command not found`, install/start Docker Desktop first, then open a **new** terminal.

**Option B — Hybrid (hot reload while developing)**  
- Node.js 20+ and npm  
- Docker Desktop only for MongoDB (or any local MongoDB on port `27017`)

---

## Run with Docker (full stack)

This starts MongoDB + API + web UI. You do **not** need to create `.env` files — Compose sets them.

### 1. Clone the repo

```bash
git clone https://github.com/shubham80621/LearningPlatform.git
cd LearningPlatform
```

### 2. Build and start all services

```bash
docker compose up --build
```

Leave this terminal open. The first build can take several minutes. Wait until the API and web containers are up (server healthcheck passes).

Services started:

| Container | Role |
|-----------|------|
| `learning-platform-db` | MongoDB |
| `learning-platform-server` | NestJS API on port 3000 |
| `learning-platform-client` | React app (nginx) on port 8080 |

### 3. Seed demo data (second terminal)

Open another terminal in the same repo folder:

```bash
cd LearningPlatform
docker compose --profile seed run --rm seed
```

You should see output ending with `Seed complete.`

This loads demo users, 30 videos, questions, and assignments (demo media comes from `server/seed-assets/`).

### 4. Open the app

| What | URL |
|------|-----|
| **Web app** | http://localhost:8080 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |

The web container proxies `/api` and `/uploads` to the API so the browser stays same-origin.

### 5. Sample login credentials (after seed)

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@example.com` | `admin123` |
| Learner 1 (richest demo data) | `learner1@example.com` | `learner123` |
| Learners 2–14 | `learner2@example.com` … `learner14@example.com` | `learner123` |

### 6. Suggested smoke test

1. Log in as **admin** → Videos / Learners → open Learner 1 → Progress tab.  
2. Log out → log in as **learner1** → Home → open a lesson → watch, answer a timestamp quiz, refresh and confirm resume.

### Stop / reset

```bash
# Stop containers (keeps DB + uploaded media volumes)
docker compose down

# Full clean slate (deletes DB + uploads), then start + seed again
docker compose down -v
docker compose up --build
# then in another terminal:
docker compose --profile seed run --rm seed
```

---

## Local Development (Hybrid)

Use this when you want hot reload. Docker runs **MongoDB only**; API and client run on the host with npm.

### 1. Start MongoDB

```bash
docker compose up mongodb
```

MongoDB: `mongodb://localhost:27017/learning-platform`

### 2. Start Backend

```bash
cd server
cp .env.example .env
npm install
npm run start:dev
```

API: `http://localhost:3000/api`  
Swagger: `http://localhost:3000/api/docs`

### 3. Seed demo data

Copies the committed demo clip and thumbnails from `server/seed-assets/` into `uploads/`, then creates **30 lessons**, 14 learners, 102 questions, and a spread of assignments. Volume is deliberate so paginated lists need more than one page.

```bash
cd server
npm run seed
```

| What | Count | Notes |
|------|-------|-------|
| Videos | 30 | 28 published, last 2 left as drafts |
| Questions | 102 | *Getting Started with LearnPulse* carries 15 to stress the questions panel |
| Learners | 14 | Learners 9–14 have nothing assigned, so empty states stay reachable |
| Assignments | 27 | Mixed completed / in progress / not started |

Use the same login credentials as in the Docker section above.

**Demo walkthrough**
1. Admin: log in → Videos / Learners → page through the lists, then open Learner 1's Progress tab.
2. Learner 1: log in → Home → open a lesson → watch, answer timestamp quizzes, resume later.

### 4. Start Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

### API notes (optional)

Swagger: `http://localhost:3000/api/docs` — log in via `POST /api/auth/login`, then **Authorize** with the JWT.

Media lives in `server/uploads/` and is served at `http://localhost:3000/uploads/...`.

**Pagination.** Admin list endpoints page on the server rather than shipping the whole collection and slicing in the browser. They accept `page` (default 1) and `limit` (default 10, max 100) and return an envelope:

```json
{ "items": [], "total": 30, "page": 2, "limit": 8, "totalPages": 4 }
```

| Endpoint | Extra filters |
|----------|---------------|
| `GET /api/videos` | `search` (title or description), `status` = `all` \| `published` \| `draft`, `unassignedFor=<learnerId>` |
| `GET /api/users/learners` | `search` (name or email) |
| `GET /api/assignments/me` | `search` (video title/description), `status` = `all` \| `assigned` \| `in_progress` \| `completed` \| `continue` |
| `GET /api/assignments/me/summary` | Learner dashboard totals (donuts/KPIs) across every published assignment |

`unassignedFor` powers the assign picker, so "published videos this learner does not already have" is filtered and counted in the database instead of the client. Sorts use `createdAt` with `_id` as a tiebreaker so rows cannot shift between pages, and `search` input is regex-escaped before it reaches Mongo.

**Client lists.** Admin Videos / Learners (and the assign picker) use **Previous / Next** button pagination. Learner Home / Learning / watch playlist use infinite scroll; RTK Query merges learner pages into one cache entry per filter set. Dashboards still show cached KPI data immediately, then silently refresh totals.

## Environment Variables

### Server (`server/.env`) — hybrid only

Docker Compose injects these for the full-stack path; you only need a local `.env` for hybrid.

```
MONGODB_URI=mongodb://localhost:27017/learning-platform
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d
PORT=3000
PUBLIC_APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173,http://localhost:8080
MAX_IMAGE_SIZE_BYTES=5242880
MAX_VIDEO_SIZE_BYTES=209715200
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=120
THROTTLE_AUTH_LIMIT=5
THROTTLE_UPLOAD_LIMIT=30
```

Images max **5 MB**. Videos max **200 MB**. Oversized uploads return **413**.

**CORS.** `CORS_ORIGIN` is a comma-separated list of browser origins (hybrid Vite on `5173`, Docker web UI on `8080`).

**Rate limits.** Every API route is throttled (default **120 req / 60s**). Login and register are tighter (**5 / 60s**). Uploads and video create/update use **30 / 60s**. Exceeding a limit returns **429**. Tracked by JWT prefix when present, otherwise by client IP.

For production-scale video, the usual pattern is **presigned S3 uploads** (browser → S3, API only stores the URL). Local `server/uploads/` is the MVP stand-in.

### Client (`client/.env`) — hybrid only

```
VITE_API_URL=http://localhost:3000/api
```

In Docker, the client is built with `VITE_API_URL=/api` and nginx proxies `/api` and `/uploads` to the server.

## Testing

Backend unit tests use Jest (NestJS default). Auth coverage includes `AuthService` (login/register) and `RolesGuard` (RBAC).

```bash
cd server
npm test
```

Run only auth tests:

```bash
cd server
npm test -- --testPathPattern=auth
```

Coverage report:

```bash
cd server
npm run test:cov
```

## Assumptions and known limitations

- Local disk uploads (`server/uploads/`) instead of S3; fine for this assessment, not production scale.
- Editing a published lesson updates live content for learners; past answers are kept (no full content versioning). See `IMPROVEMENTS.md`.

## Project Structure

```
LearningPlatform/
├── client/               # React frontend (+ Dockerfile / nginx)
├── server/               # NestJS backend (+ Dockerfile)
│   ├── seed-assets/      # Demo video + thumbnails used by seed
│   └── uploads/          # Runtime media (gitignored; volume in Docker)
├── IMPROVEMENTS.md       # Deferred / future work
└── docker-compose.yml    # MongoDB + API + web (+ seed profile)
```
