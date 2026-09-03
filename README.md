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

## Development Status

- [x] NestJS backend scaffold
- [x] React frontend scaffold
- [x] Docker MongoDB setup
- [ ] Auth (JWT + roles)
- [ ] Video CRUD + questions
- [ ] Assignments + progress tracking
- [ ] Admin reporting
- [ ] Full Docker Compose (server + client)

## Notes

- During development, MongoDB runs in Docker while frontend/backend run with `npm run dev` for faster hot reload.
- Full one-command Docker setup will be added before submission.
