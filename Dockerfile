# Medusa v2 — build from monorepo root so Railway does not run Railpack on ./ without a Node app.
# See .dockerignore: exclude other apps to avoid slow uploads and Docker build timeouts.
FROM node:20-bookworm-slim

WORKDIR /app

# Railway builders can have slow npm registry access; avoid failing mid-install.
ENV NPM_CONFIG_FETCH_RETRIES=10 \
    NPM_CONFIG_FETCH_TIMEOUT=300000 \
    NPM_CONFIG_PROGRESS=false \
    CI=true

COPY medusa-backend/package*.json ./

RUN npm config set fetch-retries 10 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --no-audit --no-fund

COPY medusa-backend/ ./
# Seed script resolves image paths like ../web/public/... from /app → /web/public/...
COPY web/public/images /web/public/images

# medusa build (admin + server) is memory-heavy
ENV NODE_OPTIONS=--max-old-space-size=6144
RUN npm run build

# Medusa v2 production: start from `.medusa/server` (see https://docs.medusajs.com/learn/build )
ENV NODE_ENV=production
RUN cd .medusa/server && npm install --omit=dev --no-audit --no-fund

WORKDIR /app/.medusa/server
EXPOSE 9000

CMD ["npm", "run", "start"]
