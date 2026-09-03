# Video Learning + Interactive Quiz Platform

Mini learning platform where admins create video-based content with timestamp-based questions, and learners watch videos with interactive quizzes.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** NestJS, MongoDB, JWT
- **Database:** MongoDB (Docker for local development)

## Prerequisites

- Node.js 20+
- npm
- Docker Desktop (for MongoDB)

## Local Development (Hybrid)

### 1. Start MongoDB

```bash
docker compose up mongodb
```

MongoDB will be available at `mongodb://localhost:27017/learning-platform`

### 2. Start Backend

```bash
cd server
cp .env.example .env
npm install
npm run start:dev
```

API: `http://localhost:3000/api`  
Swagger UI: `http://localhost:3000/api/docs`

1. Open Swagger UI in the browser.
2. Call `POST /api/auth/login` (e.g. `admin@example.com` / `admin123`).
3. Copy the `access_token` from the response.
4. Click **Authorize**, paste the token only (Swagger adds `Bearer `), and try protected endpoints.

**Create a video (admin):**
1. `POST /api/uploads/image` — thumbnail → copy `url`
2. `POST /api/uploads/video` — video file → copy `url`
3. `POST /api/videos` with `title`, `description`, `thumbnailUrl`, `videoUrl`, `duration` (seconds)

Media is stored in `server/uploads/images` and `server/uploads/videos`, and served at `http://localhost:3000/uploads/...`.

### 3. Start Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

## Environment Variables

### Server (`server/.env`)

```
MONGODB_URI=mongodb://localhost:27017/learning-platform
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d
PORT=3000
MAX_IMAGE_SIZE_BYTES=5242880
MAX_VIDEO_SIZE_BYTES=209715200
```

Images max **5 MB**. Videos max **200 MB**. Oversized uploads return **413**.

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
├── client/          # React frontend
├── server/          # NestJS backend
│   └── uploads/     # Local image + video files (swap for S3 later)
└── docker-compose.yml
```

