# Video Learning + Interactive Quiz Platform

Mini learning platform where admins create video-based content with timestamp-based questions, and learners watch videos with interactive quizzes.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** NestJS, MongoDB, JWT
- **Database:** MongoDB

## Prerequisites

- Docker Desktop (recommended — runs the full stack)
- Or Node.js 20+ and npm for hybrid local development

## Quick start (Docker — full stack)

From the repo root:

```bash
# Build and start MongoDB + API + web app
docker compose up --build

# In another terminal: load demo users, videos, questions, assignments
docker compose --profile seed run --rm seed
```

| Service | URL |
|---------|-----|
| App | http://localhost:8080 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |

The web container proxies `/api` and `/uploads` to the API, so the browser stays same-origin.

**Demo accounts** (after seed)

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@example.com` | `admin123` |
| Learner 1 | `learner1@example.com` | `learner123` |
| Learners 2–14 | `learner2@example.com` … | `learner123` |

Stop everything: `docker compose down`  
Wipe DB + uploads: `docker compose down -v`

---

## Local Development (Hybrid)

Use this when you want hot reload. Docker still runs MongoDB only.

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

### Server (`server/.env`)

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

### Client (`client/.env`)

```
VITE_API_URL=http://localhost:3000/api
```

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

## Project Structure

```
LearningPlatform/
├── client/          # React frontend (+ Dockerfile / nginx)
├── server/          # NestJS backend (+ Dockerfile, seed-assets/)
│   └── uploads/     # Local image + video files (swap for S3 later)
├── IMPROVEMENTS.md  # Deferred / future work (e.g. content versioning)
└── docker-compose.yml  # MongoDB + API + web (+ optional seed profile)
```

