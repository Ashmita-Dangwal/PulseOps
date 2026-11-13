# PulseOps — Full-stack uptime monitoring

PulseOps is a full-stack service monitoring application with a browser dashboard, Express API, MongoDB persistence, Redis/BullMQ scheduling, JWT authentication, and authenticated Socket.IO events.

## Requirements

- Node.js **22.19.0 or newer** (required by the locked `undici` release)
- MongoDB Atlas or MongoDB 7+
- Docker Desktop (recommended for Redis) or Redis 6+

## Setup on Windows PowerShell

1. Extract the project ZIP and open the `PulseOps` folder in VS Code.
2. Create your private environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Edit `.env`. Set `MONGODB_URI` to your Atlas connection string and set `JWT_SECRET` to a random secret of at least 32 characters. Never share or commit `.env`.
4. Start Redis:

   ```powershell
   docker compose up -d redis
   ```

   If you already have the `pulseops-redis` container running, you can keep using it instead.
5. Install packages and start the API:

   ```powershell
   npm install
   npm run dev
   ```

6. Open a second terminal and serve the frontend:

   ```powershell
   cd frontend
   python -m http.server 5173
   ```

7. Visit `http://localhost:5173`, create an account, create a project, then add a monitor.

API: `http://localhost:5000`
Swagger: `http://localhost:5000/api-docs`
Health endpoint: `http://localhost:5000/api/health`

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign/verify access tokens (32+ characters) |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `REDIS_HOST` | Redis hostname (default `127.0.0.1`) |
| `REDIS_PORT` | Redis port (default `6379`) |
| `CORS_ORIGIN` | Comma-separated allowed browser origins |

## Features

- Account registration/login with bcrypt password hashing and JWT bearer tokens.
- User-scoped project and monitor CRUD APIs.
- Mongoose models for users, projects, monitors, health-check results, and incidents.
- BullMQ recurring monitor checks scheduled in Redis.
- Persisted status, response time, check history, incident open/update/resolve lifecycle.
- Analytics calculated from stored check records.
- Authenticated Socket.IO connections with per-user rooms and `monitor:status`, `incident:created`, and `incident:resolved` events.
- Dashboard for projects, monitor status, response times, monitor edit/pause/resume/delete, check history, analytics and incident history.
- Health-check URL validation rejects private/reserved IP destinations and does not follow redirects to reduce SSRF risk.

## API reference

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Authenticate and receive JWT |
| GET | `/api/auth/me` | Current account (JWT required) |
| GET / POST | `/api/projects` | List or create projects |
| GET / PUT / DELETE | `/api/projects/:id` | Read, update or delete a project |
| GET / POST | `/api/monitors` | List or create monitors |
| GET / PUT / DELETE | `/api/monitors/:id` | Read, update or delete a monitor |
| PATCH | `/api/monitors/:id/pause` | Pause a monitor |
| PATCH | `/api/monitors/:id/resume` | Resume a monitor |
| GET | `/api/monitors/:id/checks?limit=100` | Historical checks (max 200) |
| GET | `/api/incidents` | Incident history; optional `status=OPEN` or `RESOLVED` |
| GET | `/api/analytics` | Analytics from persisted checks; optional monitor/project/date filters |

All project, monitor, incident, and analytics routes require `Authorization: Bearer <token>`. Each user's data is scoped to their authenticated account. The health endpoint and registration/login are public.

## Monitoring behavior

- Minimum interval: 30 seconds.
- Timeout: 1,000–30,000 milliseconds.
- A monitor is marked DOWN after a failed check. An incident is opened after three consecutive failures.
- A successful check marks the monitor UP, resets the failure count, and resolves an open incident.
- Recurring checks are processed by the BullMQ worker in the API process. Keep Redis running while PulseOps is running.
- The first scheduled check is run after the configured interval. The monitor dashboard displays status after the first completed check.

## Tests and checks

```powershell
npm run check
npm test
```

`npm run check` validates JavaScript syntax. Jest tests are included in `tests/`. Some integration tests require MongoDB/Redis and network access; run them only with a development database.

## Project structure

- `src/models/` — Mongoose schemas
- `src/controllers/` — API handlers
- `src/routes/` — Express routes
- `src/middleware/` — authentication and error handling
- `src/services/` — monitoring, analytics, scheduling and incident logic
- `src/queues/`, `src/workers/` — BullMQ queue and worker
- `src/sockets/` — authenticated Socket.IO setup
- `frontend/` — static dashboard application
- `docker-compose.yml` — Redis service for local development

## Production hardening

Before public deployment, use HTTPS, rotate and protect secrets, restrict Atlas and Redis network access, set a strict `CORS_ORIGIN`, configure database backups, run under a process manager, and consider a separate worker process plus a Socket.IO Redis adapter for multi-instance deployments. Do not expose Redis publicly.
