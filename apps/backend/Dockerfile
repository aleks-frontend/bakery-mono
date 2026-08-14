# Build context is the repo root (npm workspaces monorepo), e.g.:
#   docker build -f apps/backend/Dockerfile -t bakery-backend .
FROM node:20-alpine AS build
WORKDIR /workspace

# Copy every workspace's package.json first (npm workspaces resolves via the
# "apps/*"/"packages/*" globs, and `npm ci` needs all of them present to match
# package-lock.json) so this dependency layer stays cached across app-only edits.
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/admin-panel/package.json apps/admin-panel/package.json
COPY apps/order-form/package.json apps/order-form/package.json
COPY packages/schemas/package.json packages/schemas/package.json
COPY packages/api-client/package.json packages/api-client/package.json
RUN npm ci --ignore-scripts

COPY packages/schemas packages/schemas
COPY apps/backend apps/backend
RUN npm run build -w @bakery/schemas

# `prisma generate` only reads prisma/schema.prisma to emit the client - it
# never connects to a database - so a placeholder DATABASE_URL is enough here.
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
RUN npm exec --workspace @bakery/backend -- prisma generate

RUN npm run build -w @bakery/backend

FROM node:20-alpine AS runtime
WORKDIR /workspace
ENV NODE_ENV=production

# Copy each workspace directory wholesale (not just dist/package.json) rather
# than cherry-picking - npm's dedup doesn't always hoist every dependency to
# the root node_modules; some (e.g. better-auth) get nested under a specific
# workspace's own node_modules instead, and a partial copy silently misses those.
COPY --from=build /workspace/node_modules node_modules
COPY --from=build /workspace/package.json /workspace/package-lock.json ./
COPY --from=build /workspace/apps/backend apps/backend
COPY --from=build /workspace/packages/schemas packages/schemas

WORKDIR /workspace/apps/backend
# Railway injects its own PORT at runtime; src/index.ts already reads
# process.env.PORT, falling back to 3001 for other environments.
EXPOSE 3001
CMD ["node", "dist/index.js"]
