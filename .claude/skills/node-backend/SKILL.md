---
name: node-backend
description: Build and modify Node.js backends (REST APIs, Express/Fastify servers, scripts) for this project. Use when creating or editing server code, API routes, middleware, env config, database access, auth, or backend tests. No Docker — run everything locally with npm.
---

# Node.js backend

## Stack defaults
- Node.js 24 LTS (`"engines": { "node": ">=22" }`), ES modules (`"type": "module"`).
- TypeScript preferred; run in dev with `tsx watch src/index.ts`, build with `tsc`.
- Express 5 (or Fastify if the user asks). Express 5 forwards rejected promises from async handlers to the error middleware, so no `try/catch` wrapper is needed per route.
- Validation: `zod` at every request boundary (body, params, query).
- Config: `.env` loaded via `node --env-file=.env` (built in, no `dotenv` needed). Commit `.env.example`, never `.env`.
- Testing: `vitest` + `supertest`.
- No Docker. Use a hosted DB (Neon/Postgres, SQLite for prototypes) via `DATABASE_URL`.

## Layout
```
server/
  src/
    index.ts          # starts the server (listen only here)
    app.ts            # builds and exports the express app (for tests)
    routes/<feature>.ts
    services/<feature>.ts   # business logic, no req/res
    db/               # client + queries/migrations
    middleware/       # auth, error handler, request logging
    lib/env.ts        # zod-parsed process.env, fail fast on startup
  test/
  package.json
  tsconfig.json
```

## Scripts
```json
{
  "dev": "tsx watch --env-file=.env src/index.ts",
  "build": "tsc -p .",
  "start": "node --env-file=.env dist/index.js",
  "test": "vitest run",
  "lint": "eslint ."
}
```

## Rules
1. Keep `app.ts` free of `listen()` so tests can import the app.
2. Routes stay thin: parse with zod → call a service → send JSON. Logic lives in services.
3. One central error middleware returns `{ error: { message, code } }` with a proper status code; never leak stack traces when `NODE_ENV=production`.
4. Enable CORS only for the frontend origin (`CORS_ORIGIN` env var, default `http://localhost:5173`).
5. Use parameterized queries or an ORM (Drizzle/Prisma). Never interpolate SQL strings.
6. Hash passwords with `argon2` or `bcrypt`; keep secrets in env vars only.
7. Use `async/await` throughout. No callbacks, no blocking `fs.*Sync` calls in request paths.
8. Add a `GET /api/health` endpoint returning `{ ok: true }`.
9. Prefix all routes with `/api` so the Vite dev proxy can forward them.

## Minimal app
```ts
// src/app.ts
import express from "express";
import cors from "cors";
import { env } from "./lib/env.js";

export const app = express();
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status ?? 500;
  res.status(status).json({ error: { message: status === 500 ? "Internal error" : err.message } });
});
```

## Before saying a change is done
- `npm run build` passes with no type errors.
- `npm test` passes.
- Start the server with `npm run dev` and `curl localhost:$PORT/api/health` returns OK.
