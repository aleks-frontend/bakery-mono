# Build context is the repo root (npm workspaces monorepo), e.g.:
#   docker build -f apps/admin-panel/Dockerfile \
#     --build-arg VITE_BACKEND_URL=https://your-backend.up.railway.app \
#     -t bakery-admin-panel .
#
# VITE_BACKEND_URL is baked in at build time (Vite env vars are compile-time,
# not read at container runtime), so it must be passed as a build arg - on
# Railway, set it as a "Build Variable" on this service, not a plain runtime
# variable.
FROM node:20-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/admin-panel/package.json apps/admin-panel/package.json
COPY apps/order-form/package.json apps/order-form/package.json
COPY packages/schemas/package.json packages/schemas/package.json
COPY packages/api-client/package.json packages/api-client/package.json
RUN npm ci --ignore-scripts

COPY packages/schemas packages/schemas
COPY packages/api-client packages/api-client
COPY apps/admin-panel apps/admin-panel
RUN npm run build -w @bakery/schemas
RUN npm run build -w @bakery/api-client

ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN npm run build -w @bakery/admin-panel

FROM nginx:1.27-alpine AS runtime
COPY apps/admin-panel/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/admin-panel/dist /usr/share/nginx/html

# Railway's "port your app is listening on" should be set to 8080 for this
# service when generating its domain.
EXPOSE 8080
