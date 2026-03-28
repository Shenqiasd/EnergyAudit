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

# Install all dependencies (pnpm symlinks must stay in the same stage)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the API
RUN pnpm --filter @energy-audit/api run build

# ---- Production ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built API output
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json

# Copy the full node_modules (pnpm hoisted) — symlinks are resolved by Docker COPY
COPY --from=build /app/node_modules ./node_modules

# Copy migration files (needed at runtime)
COPY --from=build /app/apps/api/src/db/migrations ./apps/api/dist/db/migrations

EXPOSE 3001

ENV API_PORT=3001

CMD ["node", "apps/api/dist/main.js"]
