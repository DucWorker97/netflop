# ─────────────────────────────────────────────────────────────
# Worker Dockerfile (Production)
# Includes FFmpeg for HLS encoding
# ─────────────────────────────────────────────────────────────

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json ./apps/worker/
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/ ./packages/tsconfig/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/worker/ ./apps/worker/
COPY apps/api/prisma ./apps/api/prisma
COPY packages/shared/ ./packages/shared/

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build
RUN cd apps/worker && pnpm run build

# ─────────────────────────────────────────────────────────────
# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install FFmpeg (required for HLS encoding)
RUN apk add --no-cache ffmpeg

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 worker

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json ./apps/worker/
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/ ./packages/tsconfig/

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma
COPY apps/api/prisma ./apps/api/prisma

# Create temp directory for encoding
RUN mkdir -p /tmp/netflop-worker && chown worker:nodejs /tmp/netflop-worker

# Set user
USER worker

# Environment
ENV NODE_ENV=production

WORKDIR /app/apps/worker

CMD ["node", "dist/main.js"]
