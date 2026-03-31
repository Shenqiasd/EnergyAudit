# ---- Build ----
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate
WORKDIR /app

# Copy workspace config and all package.json files for lockfile resolution
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/domain/package.json ./packages/domain/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/integrations/package.json ./packages/integrations/package.json
COPY packages/config-engine/package.json ./packages/config-engine/package.json
COPY packages/reporting/package.json ./packages/reporting/package.json

# Install all dependencies (pnpm symlinks must stay in the same stage)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# INTERNAL_API_URL is used in next.config.ts rewrites and baked at build time.
# Railway sets this as a build-time variable; defaults to localhost for local dev.
ARG INTERNAL_API_URL=http://localhost:3001
ENV INTERNAL_API_URL=${INTERNAL_API_URL}

# Build Next.js (standalone output)
RUN pnpm --filter @energy-audit/web run build

# ---- Production ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Next.js standalone output includes everything needed
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
# Note: Add this line when apps/web/public/ exists:
# COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
