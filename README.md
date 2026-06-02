# CollabFlow — Smart Project & Task Collaboration System

Full-stack team collaboration platform: projects, tasks, role-based workflows,
real-time activity, and analytics.

| Layer    | Tech                                                          |
| -------- | ------------------------------------------------------------ |
| Frontend | React 19, TanStack Router/Query/Table/Form, Tailwind v4      |
| Backend  | NestJS 11, MikroORM 6 (MongoDB driver), MongoDB 7            |
| Auth     | JWT (access + refresh) + bcrypt                              |
| Realtime | Socket.IO (NestJS Gateway)                                  |
| Monorepo | pnpm workspaces                                              |

## Build status

This repo is being built as a **runnable vertical slice** first:

- [x] Monorepo + shared types
- [x] Auth (signup/login/refresh/logout/me) + RBAC guards
- [x] Projects (CRUD, members, business rules)
- [x] Tasks (CRUD, validation rules, status updates)
- [x] Web: login, dashboard, projects (list/new/detail), tasks (list/detail)
- [ ] Comments, activity log, notifications  *(follow-up pass)*
- [ ] WebSockets, analytics charts          *(follow-up pass)*
- [ ] Tests, Docker, polish                 *(follow-up pass)*

## Prerequisites

```
Node.js  >= 20.x
pnpm     >= 9.x
MongoDB  >= 7.x   (local, Docker, or Atlas connection string)
```

## Quick start

```bash
pnpm install

# Backend env — paste your MongoDB Atlas URI into MONGODB_URI
cp .env.example apps/api/.env       # then edit MONGODB_URI
cp .env.example apps/web/.env        # web only needs the VITE_* lines

# Seed the demo admin (first run only)
pnpm seed

# Run both apps
pnpm dev
# API   → http://localhost:4000  (Swagger: /api/docs)
# Web   → http://localhost:5173
```

### Demo login

```
Email:    admin@collabflow.dev
Password: Demo@1234
```

## Structure

```
collabflow/
├── apps/
│   ├── api/        # NestJS backend
│   └── web/        # React frontend
└── packages/
    └── shared/     # Shared enums, types, API contracts
```
