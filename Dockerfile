# ==========================================
# PDFSun Multi-Stage Production Dockerfile
# Pillar 5: Zero-Downtime & High-Security Container
# ==========================================

# --- Stage 1: Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files & build production bundle
COPY . .
RUN npm run build

# --- Stage 2: Production Execution Stage ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user for Zero-Trust container security
RUN addgroup -g 1001 -S pdfsun && \
    adduser -S pdfsun -u 1001 -G pdfsun

# Copy compiled assets and external dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Create temp upload directories with non-root ownership
RUN mkdir -p /tmp/pdfsun_uploads /tmp/pdfsun_processed && \
    chown -R pdfsun:pdfsun /app /tmp/pdfsun_uploads /tmp/pdfsun_processed

USER pdfsun

EXPOSE 3000

# Pillar 5: Health Check Instruction for Auto-Healing
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]
