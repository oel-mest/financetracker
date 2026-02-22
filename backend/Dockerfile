# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

# Prune dev dependencies
RUN npm install --omit=dev

# ── Stage 2: Runtime ──────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/dist    ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

USER appuser

EXPOSE 2027

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:2027/health || exit 1

CMD ["node", "dist/index.js"]