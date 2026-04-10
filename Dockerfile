# Medusa v2 — build from monorepo root so Railway does not run Railpack on ./ without a Node app.
# Alternative: set Railway service "Root Directory" to `medusa-backend` and use Nixpacks/Railpack there instead.
FROM node:20-bookworm-slim

WORKDIR /app

COPY medusa-backend/package*.json ./
RUN npm ci

COPY medusa-backend/ ./
# Seed script resolves image paths like ../web/public/... from /app → /web/public/...
COPY web/public/images /web/public/images

RUN npm run build

ENV NODE_ENV=production
EXPOSE 9000

CMD ["npm", "run", "start"]
