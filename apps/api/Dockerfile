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

# Build the API (automatically builds workspace dependencies via chained build script)
RUN pnpm --filter @energy-audit/api run build

# ---- Production ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built API output
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json

# Copy node_modules — both root (pnpm store) and workspace-local (symlinks)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules

# Copy compiled workspace packages needed at runtime
COPY --from=build /app/packages/integrations/dist ./packages/integrations/dist
COPY --from=build /app/packages/integrations/package.json ./packages/integrations/package.json

# Copy migration files (needed at runtime)
COPY --from=build /app/apps/api/src/db/migrations ./apps/api/dist/db/migrations

EXPOSE 3001

ENV API_PORT=3001

CMD ["node", "apps/api/dist/main.js"]
