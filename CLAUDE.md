# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Monorepo for a full-stack Task Manager. Two separate projects share the same git root:

- **`/backend`** — Standalone NestJS server (port 5000). Used for local development only; not deployed.
- **`/frontend`** — Next.js 15 app that is deployed to Vercel. Contains both the React UI and a NestJS serverless backend embedded via `pages/api/`.

## Commands

### Frontend (Next.js + embedded NestJS)
```bash
cd frontend
npm install
npm run dev       # http://localhost:3000 (also starts the API at /api/tasks)
npm run build     # production build — must pass before deploying
npm run lint
```

### Backend (standalone, local only)
```bash
cd backend
npm install
npm run start:dev    # watch mode, http://localhost:5000
npm run build        # compiles to dist/
npm run start:prod   # runs dist/main.js
```

### Deploy to Vercel (from frontend/)
```bash
cd frontend
vercel --prod --yes
```

## Architecture

### Dual-mode NestJS

The NestJS module lives in **two places** and serves two purposes:

| Location | Purpose |
|---|---|
| `backend/src/` | Standalone server for local dev (`npm run start:dev` on port 5000) |
| `frontend/src/nest/` | Embedded in Vercel serverless function |

The code is **duplicated** between the two locations — `backend/src/tasks/` and `frontend/src/nest/tasks/` are identical. Changes to business logic must be applied in both.

### Serverless NestJS on Vercel

`frontend/pages/api/[...path].ts` is a Next.js Pages Router catch-all API route that catches all `/api/*` requests. It bootstraps NestJS with `ExpressAdapter` and calls the Express app directly (not via `serverless-http`, which expects Lambda events rather than Node.js `req`/`res`). The bootstrapped app is cached in a module-level variable so the in-memory task store survives warm function invocations.

```
Request → /api/tasks
         → pages/api/[...path].ts (Next.js Pages Router)
         → NestFactory.create(AppModule, ExpressAdapter)
         → TasksController (@Controller('tasks'), global prefix 'api')
         → TasksService (in-memory Task[])
```

The global prefix is set to `'api'` inside the serverless handler, so NestJS routes map as:
- `GET  /api/tasks`
- `POST /api/tasks`
- `DELETE /api/tasks/:id`

### Frontend API calls

`frontend/app/page.tsx` uses the **relative path** `/api/tasks` — no `NEXT_PUBLIC_API_URL` or localhost reference. This works identically in local dev (Next.js proxies to the Pages API route) and on Vercel (same domain).

### Babel configuration

The `.babelrc` in `frontend/` disables Next.js's default SWC compiler and enables Babel. This is required to support NestJS TypeScript decorators (`@Controller`, `@Injectable`, etc.) because SWC does not emit `reflect-metadata` calls. The plugin order is significant:
1. `babel-plugin-transform-typescript-metadata` (must be first — emits reflect-metadata)
2. `@babel/plugin-proposal-decorators` with `{ "legacy": true }`
3. Class property plugins with `{ "loose": true }` (must match to avoid Babel conflicts)

`tsconfig.json` sets `"isolatedModules": true` (required by Next.js) alongside `"emitDecoratorMetadata": true`. The conflict between these two is resolved by using `import type` for any interface imported into a decorated class signature — see `tasks.controller.ts` and `tasks.service.ts`.

### In-memory state and serverless limits

Tasks are stored in `TasksService`'s private `tasks: Task[]` array. On Vercel, state persists only within a single warm function instance. If Vercel routes requests to different instances (under load), state will not be shared. This is an accepted limitation given the no-database requirement.

## CI/CD

GitHub repo: `https://github.com/HabibParvej/Task-Manager`
Vercel project: `habibs-projects-88adb2fd/frontend`

- Vercel root directory is configured to `frontend/`
- Every push to `master` triggers an automatic Vercel production deploy (~45 seconds)
- The standalone `backend/` directory is ignored by Vercel

## Key Constraints

- **No database** — all storage is in-memory inside NestJS
- **No `NEXT_PUBLIC_API_URL`** — always use relative `/api/tasks` paths in the frontend
- **Do not use `serverless-http`** to handle requests — call the Express app directly: `app(req, res)` not `serverlessHttp(app)(req, res)`
- **`isolatedModules` + decorator types** — always use `import type` when importing a TypeScript interface into a file that uses NestJS decorators
