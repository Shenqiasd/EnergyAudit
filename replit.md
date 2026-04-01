# Energy Audit Platform

A pnpm monorepo energy audit management platform (能源审计管理平台) migrated from Vercel/Railway to Replit.

## Architecture

- **`apps/web`** — Next.js 16 frontend (Turbopack dev mode), port 5000
- **`apps/api`** — NestJS 11 backend (Fastify), port 3001
- **`packages/config-engine`** — Shared validation/calculation engine (CommonJS output)
- **`packages/reporting`** — Shared report template types (CommonJS output)
- **`packages/integrations`** — External integration utilities (CommonJS output)
- **`packages/domain`** — Domain types
- **`packages/shared`** — Shared utilities

## Package Manager

pnpm 10.26.1 (monorepo with Turborepo)

## Workflows

- **Start application** — Runs `cd apps/web && pnpm run dev` on port 5000 (webview)
- **API** — Runs `cd apps/api && pnpm run dev` on port 3001 (console)

## Required Secrets

- `DATABASE_URL` — PostgreSQL connection string (Replit managed)
- `JWT_SECRET` — JWT signing secret (optional, defaults to dev value)

## Environment Variables

- `NODE_ENV=development`
- `API_PORT=3001`
- `NEXT_PUBLIC_API_URL=/api/v1`
- `INTERNAL_API_URL=http://localhost:3001`

## Key Configuration Changes for Replit

1. **Port**: Next.js dev server runs on port 5000 (Replit webview port) with `-H 0.0.0.0`
2. **Standalone mode removed**: `output: "standalone"` removed from next.config.ts (not needed for dev)
3. **Package manager version**: Updated `packageManager` field to match Replit's installed pnpm (10.26.1)
4. **Native build scripts**: Added `pnpm.onlyBuiltDependencies` to package.json for `@nestjs/core`, `bcrypt`, `esbuild`, `sharp`
5. **Shared packages CommonJS**: `packages/config-engine` and `packages/reporting` tsconfig updated to output CommonJS (module: CommonJS, moduleResolution: Node) so NestJS can load them at runtime
6. **Missing dependency**: Added `@energy-audit/config-engine: workspace:*` to `apps/api/package.json`
7. **Root layout force-dynamic**: Added `export const dynamic = 'force-dynamic'` to `apps/web/src/app/layout.tsx` — prevents Next.js 16 + React 19 from statically prerendering all 50 pages (useEffect/useContext null dispatcher bug during prerender)
8. **Radix UI replaced**: Replaced `@radix-ui/react-toast` (Toaster), `@radix-ui/react-dialog` (Modal), `@radix-ui/react-select` (Select) with native HTML equivalents to eliminate prerender failures in those components
9. **global-error.tsx**: Added `apps/web/src/app/global-error.tsx` as a minimal client component (required by Next.js for `_global-error` page)
10. **prerenderEarlyExit false**: Added `experimental.prerenderEarlyExit: false` to `next.config.ts` to allow build to continue when `_global-error` prerender fails (Next.js 16.2.1 + Turbopack internal bug with `LayoutRouterContext` during `_global-error` prerender)
11. **Next.js worker patch**: `scripts/patch-next.js` runs as `postinstall` hook — patches `next/dist/export/worker.js` to convert uncaught `TypeError` to `ExportPageError` and reset `result = undefined` so `_global-error` prerender failure is silently skipped without blocking the build. Uses Node.js string replacement (no diff/patch command) so it works reliably after fresh `pnpm install`.
12. **Removed Google font**: Removed `next/font/google` (Inter) from root layout to avoid potential module initialization issues during `_global-error` prerender
13. **Geist font**: Added `geist` npm package for Geist Sans and Mono fonts (Vercel's design system font), used as CSS variables `--font-geist-sans` and `--font-geist-mono`

## UI Design System (Task #2 - Longcut.ai-inspired)

- **Font**: Geist Sans (geometric, modern) via `geist` npm package
- **Color palette**: Near-white background `#f8f9fb` (HSL 220 20% 97%), pure white cards, very light borders `#e8e8e8` (HSL 0 0% 91%), neutral dark text `#333` (HSL 0 0% 20%), neutral gray muted `#787878` (HSL 0 0% 47%)
- **Dark sidebar**: Deep slate `hsl(222 47% 11%)` with active item left-accent pill indicator
- **Border radius**: `rounded-2xl` (24px) for cards, `rounded-xl` (16px) for buttons/inputs/badges
- **Shadows**: Custom CSS variables `--shadow-xs/sm/md/lg` for layered depth
- **Animations**: Framer Motion stagger animations on all dashboard stat cards and list items; page transitions via PageTransition component
- **Badges**: Pill-shaped (rounded-full) with semantic color variants
- **StatCard**: Clean white card with colored icon backgrounds, TrendingUp/Down icons, sparklines

## UI Design

The frontend uses a "Deep Slate Indigo" design system (redesigned in v0.2.0):
- **Color palette**: Primary `224 71% 40%` (deep slate-indigo), distinct sidebar dark background
- **Redesigned pages**: Home role-selector, Login (split-screen dark/light layout)
- **Layout**: Dark solid sidebar with strong active states; polished header with breadcrumbs
- **Components**: Button, Card, Badge, Input, Table, StatCard — all with refined shadows/hover states
- **Dashboards**: Enterprise workbench and Manager analytics hub both visually upgraded

## Database Setup

- **Auto-migration**: `apps/api/src/main.ts` calls `runMigrations()` on every startup — automatically applies any unapplied SQL migrations from `src/db/migrations/` to the database (tracked via `_migrations` table)
- **Migration files**: `apps/api/src/db/migrations/*.sql` — 13+ SQL files covering all schema. Copied to `dist/db/migrations/` via nest-cli.json `assets` config
- **Manual run**: `cd apps/api && pnpm run migrate` if needed
- **Default dev accounts** (auto-created by `loginDev` on first click of dev shortcuts):
  - `manager@dev.local` / `dev123456` — Manager role
  - `reviewer@dev.local` / `dev123456` — Reviewer role
  - `enterprise_user@dev.local` / `dev123456` — Enterprise user role

## Authentication

- **JWT-based auth**: All API endpoints require a valid JWT Bearer token (except `/auth/login`, `/auth/register`, `/health`)
- **Login page dev shortcuts**: The three role buttons (`企业端`, `管理端`, `审核端`) automatically call `loginDev` which registers the dev account if needed, logs in, stores JWT, then redirects — no manual credentials needed
- **Token storage**: `localStorage` — key `energy_audit_token` (access token), `energy_audit_refresh_token`

## Development Notes

- Shared packages (`config-engine`, `reporting`, `integrations`) must be built before starting the API
- The API's `nest start --watch` takes ~10 seconds to compile TypeScript before opening port 3001
- Dev API proxying: Next.js rewrites `/api/*` to `http://localhost:3001/api/*`

## Production Deployment Architecture

The `.replit` port mapping is fixed: `localPort = 3001 → externalPort = 80`. This means all external HTTPS traffic (port 80/443) routes to local port 3001. The deployment is configured accordingly:

- **Frontend**: `next start --port 3001` (receives all external traffic)
- **API**: `node dist/main` with `API_PORT=4000` (internal only, no external exposure)
- **Build-time**: `INTERNAL_API_URL=http://localhost:4000` so Next.js rewrites are compiled to target port 4000
- **Result**: external request → port 80 → port 3001 (Next.js) → proxies `/api/*` → port 4000 (NestJS)

Do NOT change the API port or INTERNAL_API_URL in production without also updating the Next.js build step (rewrites are compiled at build time, not runtime).
