---
name: react-frontend
description: Build and modify the React frontend for this project (components, pages, routing, state, forms, styling, API calls). Use when creating or editing anything under client/, .tsx/.jsx files, UI components, hooks, or frontend tests. No Docker — runs locally with Vite.
---

# React frontend

## Stack defaults
- React 19 + TypeScript, scaffolded with Vite: `npm create vite@latest client -- --template react-ts`.
- Styling: Tailwind CSS v4 (`@tailwindcss/vite` plugin). Add shadcn/ui components when you need polished primitives.
- Routing: `react-router` (v7) in declarative/SPA mode.
- Server state: TanStack Query. Local UI state: `useState`/`useReducer`; reach for Zustand only when state is truly global.
- Forms: `react-hook-form` + `zod` (share schemas with the backend if practical).
- Testing: `vitest` + `@testing-library/react` + `jsdom`.

## Layout
```
client/
  src/
    main.tsx            # providers (QueryClient, Router)
    App.tsx             # routes
    pages/<Page>.tsx
    components/         # reusable UI, one component per file
    features/<feature>/ # components + hooks + api for a feature
    lib/api.ts          # fetch wrapper
    hooks/
  vite.config.ts
```

## Talking to the Node backend
Proxy `/api` in dev so there's no CORS hassle and no hard-coded host:
```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { "/api": "http://localhost:3000" } },
});
```
```ts
// src/lib/api.ts
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error?.message ?? res.statusText);
  return res.json();
}
```
Production API URL comes from `import.meta.env.VITE_API_URL` (only `VITE_`-prefixed vars reach the browser, so never put secrets there).

## Rules
1. Function components and hooks only. Name components in PascalCase and hooks `useX`.
2. Fetch data with TanStack Query (`useQuery`/`useMutation`), not `useEffect` + `fetch`.
3. Handle all three states for every async view: loading, error, and empty.
4. Derive values during render instead of syncing them with `useEffect`. Only use effects for actual external side effects.
5. Lists need stable `key`s (ids, not array indexes).
6. Accessibility: semantic elements (`button`, `label`, `nav`), alt text, keyboard-reachable controls.
7. Keep components small (aim for under ~150 lines); extract hooks for logic.
8. Responsive by default: mobile-first Tailwind classes.
9. Don't add `useMemo`/`useCallback` by default; add them only for a measured problem.

## Scripts
`npm run dev` (port 5173) · `npm run build` · `npm run preview` · `npx vitest run`

## Before saying a change is done
- `npm run build` passes (this runs a type check with `tsc -b`).
- Tests pass.
- Run `npm run dev` and confirm the page renders with no console errors.
