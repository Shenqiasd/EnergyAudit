# Testing Docker Deployment for EnergyAudit

## Overview
This skill covers testing the Docker-based deployment configuration for the EnergyAudit monorepo (API + Web services).

## Prerequisites
- Docker installed and running
- Access to the repository

## Devin Secrets Needed
- None required for local Docker testing
- For Railway deployment testing: Railway API token (if automating deployment)

## Key Testing Steps

### 1. Build Docker Images
```bash
# From repo root
docker build -f apps/api/Dockerfile -t energy-audit-api .
docker build -f apps/web/Dockerfile --build-arg INTERNAL_API_URL=http://test-api:3001 -t energy-audit-web .
```

### 2. Run Containers with PostgreSQL
```bash
docker network create test-net
docker run -d --name test-pg --network test-net -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=energy_audit postgres:16-alpine
sleep 3
docker run -d --name test-api --network test-net -e DATABASE_URL=postgresql://postgres:postgres@test-pg:5432/energy_audit -e API_PORT=3001 -p 3001:3001 energy-audit-api
sleep 4
docker run -d --name test-web --network test-net -e HOSTNAME=0.0.0.0 -e PORT=3000 -p 3000:3000 energy-audit-web
```

### 3. Verify Endpoints
```bash
curl http://localhost:3001/api/v1/health        # Should return {"status":"ok"}
curl http://localhost:3001/api/v1/health/db     # Should return {"database":"connected"}
curl http://localhost:3000                       # Should return HTML with "能源审计平台"
curl http://localhost:3000/api/v1/health        # Proxy test (requires correct INTERNAL_API_URL build arg)
```

### 4. Cleanup
```bash
docker stop test-api test-web test-pg; docker rm test-api test-web test-pg; docker network rm test-net
```

## Known Pitfalls

### pnpm Workspace node_modules in Docker
- `.dockerignore` MUST use `**/node_modules` (not just `node_modules`) to exclude nested workspace-local `node_modules` directories
- pnpm creates symlinks in workspace `node_modules` that point to the host's `.pnpm` store — these break inside Docker if copied
- The runner stage needs BOTH `/app/node_modules` (root pnpm store) AND `/app/apps/api/node_modules` (workspace symlinks) for proper package resolution

### ESM vs CommonJS Compilation
- The base `tsconfig.base.json` uses `module: ESNext` + `moduleResolution: Bundler`
- `nest build` (tsc) emits ESM syntax but without `.js` extensions on imports
- Node.js ESM requires explicit `.js` extensions, so `node dist/main.js` fails
- Fix: Override `tsconfig.build.json` with `module: CommonJS` + `moduleResolution: Node`
- This may introduce circular dependency issues — see next section

### Circular Dependencies under CommonJS
- CommonJS `require()` can cause issues with circular imports that ESM handles via live bindings
- Specifically: if module A requires module B, and B requires A back, exports from A may be `undefined` at the time B initializes
- Pattern to fix: extract shared constants/tokens to a separate file that neither circular module depends on
- In this project: `DRIZZLE` Symbol was extracted to `db.constants.ts` to break `database.module ↔ drizzle.provider` cycle

### Web-to-API Proxy (INTERNAL_API_URL)
- `INTERNAL_API_URL` is a build-time variable baked into the Next.js build manifest
- Default is `http://localhost:3001` — this works for local dev but NOT in Docker networking
- For Docker testing, rebuild with `--build-arg INTERNAL_API_URL=http://test-api:3001`
- On Railway, set this to `http://api.railway.internal:3001` as a service variable

## Expected Image Sizes
- API: ~850MB (includes full pnpm node_modules; could be optimized with `pnpm deploy --prod`)
- Web: ~215MB (Next.js standalone output is lean)
