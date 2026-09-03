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
```

### Client (`client/.env`)

```
VITE_API_URL=http://localhost:3000/api
```

## Project Structure

```
LearningPlatform/
├── client/          # React frontend
├── server/          # NestJS backend
└── docker-compose.yml
```

