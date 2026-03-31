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

## Development Notes

- Shared packages (`config-engine`, `reporting`, `integrations`) must be built before starting the API
- The API's `nest start --watch` takes ~10 seconds to compile TypeScript before opening port 3001
- API proxying: Next.js rewrites `/api/*` to `http://localhost:3001/api/*`
