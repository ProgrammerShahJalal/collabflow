# CollabFlow — Smart Project & Task Collaboration System

A full-stack team collaboration platform for managing projects and tasks with
role-based workflows, an activity feed, file attachments, and analytics
dashboards. Built as a pnpm monorepo with a NestJS API and a React SPA sharing a
typed contract package.

| Layer    | Tech                                                              |
| -------- | ---------------------------------------------------------------- |
| Frontend | React 19, TanStack Router / Query / Table / Form, Tailwind v4    |
| Backend  | NestJS 11, MikroORM 6 (MongoDB driver), MongoDB 7 / Atlas        |
| Auth     | JWT access + rotating refresh token (HttpOnly cookie) + bcryptjs |
| Shared   | `@collabflow/shared` — enums, types, and API contracts           |
| Tooling  | pnpm workspaces, Vite 6, Swagger / OpenAPI, Multer uploads       |

---

## Features

- **Authentication & RBAC** — signup, login, token refresh, logout, and `me`.
  Short-lived JWT access tokens (15m) plus rotating, hashed refresh tokens (7d,
  stored in an HttpOnly cookie). Three roles: **Admin**, **Project Manager**,
  and **Team Member**, enforced by route guards.
- **Projects** — full CRUD with status (`active` / `completed` / `on_hold`),
  member management (add/remove), and business-rule validation.
- **Tasks** — full CRUD with status (`todo` / `in_progress` / `completed`),
  priority (`high` / `medium` / `low`), assignment, dedicated status-change
  endpoint, and **bulk actions** (bulk status update and delete).
- **File attachments** — upload images and common document formats (PDF, Office,
  CSV, ZIP, …) on tasks, validated by MIME type and size, served statically.
- **Activity feed** — chronological, paginated log of project/task/member events
  (created, updated, assigned, status changed, deleted, member added/removed).
- **Analytics** — dashboard summary plus per-project stats, progress trend,
  upcoming deadlines, high-priority tasks, and team workload, rendered with
  Recharts.
- **API docs** — interactive Swagger UI generated from the controllers.

---

## Project structure

```
collabflow/
├── apps/
│   ├── api/        # NestJS backend (auth, projects, tasks, uploads,
│   │               # activities, analytics)
│   └── web/        # React SPA (TanStack Router file-based routes)
└── packages/
    └── shared/     # Shared enums, types, and API contracts
```

---

## Prerequisites

```
Node.js  >= 20.x
pnpm     >= 9.x   (repo is pinned to pnpm 11 via packageManager)
MongoDB  >= 7.x   (local, Docker, or a MongoDB Atlas connection string)
```

---

## Setup

```bash
# 1. Install all workspace dependencies
pnpm install

# 2. Configure environment (see Environment variables below)
cp .env.example apps/api/.env    # then set MONGODB_URI and the JWT secrets
cp .env.example apps/web/.env    # web only needs the VITE_* lines

# 3. Seed the demo users — Admin, Project Manager, Team Member (first run only)
pnpm seed

# 4. Run both apps in parallel
pnpm dev
```

| App | URL                            |
| --- | ------------------------------ |
| API | http://localhost:4000/api/v1   |
| API docs (Swagger) | http://localhost:4000/api/docs |
| Web | http://localhost:5173          |

Run them individually with `pnpm dev:api` or `pnpm dev:web`.

### Useful scripts

| Command          | Description                              |
| ---------------- | ---------------------------------------- |
| `pnpm dev`       | Run API + web in parallel (watch mode)   |
| `pnpm dev:api`   | Run only the NestJS API in watch mode    |
| `pnpm dev:web`   | Run only the Vite dev server             |
| `pnpm build`     | Build every workspace package            |
| `pnpm seed`      | Seed the demo admin account              |
| `pnpm test`      | Run tests across all packages            |

---

## Environment variables

The root [`.env.example`](.env.example) documents every variable. Copy the
relevant block into `apps/api/.env` and `apps/web/.env`.

### API (`apps/api/.env`)

| Variable                 | Description                                         | Example                          |
| ------------------------ | --------------------------------------------------- | -------------------------------- |
| `NODE_ENV`               | Runtime environment                                 | `development`                    |
| `PORT`                   | API port                                            | `4000`                           |
| `MONGODB_URI`            | MongoDB connection string (local or Atlas)          | `mongodb+srv://…/collabflow`     |
| `JWT_SECRET`             | Secret for signing access tokens (HS256)            | `dev-access-secret-change-me`    |
| `JWT_REFRESH_SECRET`     | Secret for signing refresh tokens                   | `dev-refresh-secret-change-me`   |
| `JWT_EXPIRES_IN`         | Access-token lifetime                               | `15m`                            |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token lifetime                              | `7d`                             |
| `ALLOWED_ORIGINS`        | Comma-separated CORS allow-list                     | `http://localhost:5173`          |
| `UPLOAD_DEST`            | Directory for uploaded attachments                  | `./uploads`                      |
| `MAX_FILE_SIZE_MB`       | Per-file upload size limit                          | `10`                             |
| `DEMO_ADMIN_EMAIL`       | Email for the seeded Admin user                     | `admin@collabflow.dev`           |
| `DEMO_MANAGER_EMAIL`     | Email for the seeded Project Manager user           | `manager@collabflow.dev`         |
| `DEMO_MEMBER_EMAIL`      | Email for the seeded Team Member user               | `member@collabflow.dev`          |
| `DEMO_ADMIN_PASSWORD`    | Shared password for all seeded demo users           | `Demo@1234`                      |

### Web (`apps/web/.env`)

| Variable             | Description                          | Example                          |
| -------------------- | ------------------------------------ | -------------------------------- |
| `VITE_API_BASE_URL`  | Base URL of the API (`/api/v1`)      | `http://localhost:4000/api/v1`   |
| `VITE_WS_URL`        | Base URL for realtime (reserved)     | `http://localhost:4000`          |

> Generate strong, unique values for `JWT_SECRET` and `JWT_REFRESH_SECRET` in
> any non-development environment (e.g. `openssl rand -base64 48`).

---

## Demo credentials

`pnpm seed` creates one user per role, all sharing the same password
(`DEMO_ADMIN_PASSWORD`, default `Demo@1234`). Emails are overridable via the
`DEMO_*_EMAIL` variables before seeding.

| Role            | Email                    | Password    |
| --------------- | ------------------------ | ----------- |
| Admin           | `admin@collabflow.dev`   | `Demo@1234` |
| Project Manager | `manager@collabflow.dev` | `Demo@1234` |
| Team Member     | `member@collabflow.dev`  | `Demo@1234` |

You can also use the **Sign up** page to create additional accounts.

---

## Deployment

The API and web app deploy independently.

### 1. Build

```bash
pnpm install --frozen-lockfile
pnpm build
```

### 2. API (NestJS)

- Provide all `apps/api/.env` variables via your host's secret manager.
- Point `MONGODB_URI` at a production MongoDB (e.g. MongoDB Atlas).
- Set `NODE_ENV=production` and `ALLOWED_ORIGINS` to your web app's origin.
- Ensure `UPLOAD_DEST` resolves to writable, persistent storage (a mounted
  volume) — attachments are written to disk and served statically.
- Start the compiled server:

  ```bash
  pnpm --filter @collabflow/api start:prod   # node dist/main.js
  ```

  The API listens on `PORT` and serves routes under `/api/v1`, with Swagger at
  `/api/docs`.

### 3. Web (React SPA)

- Set `VITE_API_BASE_URL` to the deployed API's `/api/v1` URL at build time
  (Vite inlines `VITE_*` vars during `pnpm build`).
- `pnpm --filter @collabflow/web build` emits a static bundle to
  `apps/web/dist/`.
- Serve `apps/web/dist/` from any static host or CDN (Netlify, Vercel, S3 +
  CloudFront, Nginx). Configure SPA fallback so unknown paths serve
  `index.html` (required for client-side routing).

### Notes

- Run the seed once against the production database to create the initial admin,
  then rotate the password.
- CORS, cookie security, and refresh-token rotation rely on the API and web
  origins being configured consistently via `ALLOWED_ORIGINS` /
  `VITE_API_BASE_URL`.

---

## Author

**Md Shah Jalal**
[shah.jalal.ju.bd@gmail.com](mailto:shah.jalal.ju.bd@gmail.com)
