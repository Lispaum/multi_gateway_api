FROM node:24-alpine AS base

# ==========================================
# Stage 1: Build
# ==========================================
FROM base AS builder

WORKDIR /app
ENV NODE_ENV=development

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci
COPY . .

# Build
RUN npm run build

# ==========================================
# Stage 2: Production
# ==========================================
FROM base AS production

WORKDIR /app
ENV NODE_ENV=production

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ wget

# Copy package files from builder
COPY --from=builder /app/build/package*.json ./
# Install production dependencies only
RUN npm ci --omit=dev
COPY --from=builder /app/build ./

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3333/health || exit 1

# Start the server
CMD ["node", "bin/server.js"]
