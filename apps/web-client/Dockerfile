# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package.jsons for layer caching
COPY packages/common/package.json ./packages/common/
COPY apps/dashboard-api/package.json ./apps/dashboard-api/
COPY apps/public-api/package.json ./apps/public-api/
COPY apps/web-dashboard/package.json ./apps/web-dashboard/
COPY apps/landing/package.json ./apps/landing/
COPY apps/consumer/package.json ./apps/consumer/
COPY apps/web-client/package.json ./apps/web-client/

# Install dependencies
RUN npm ci

# Copy source code for common package and web-client
COPY packages/common ./packages/common
COPY apps/web-client ./apps/web-client

WORKDIR /app/apps/web-client

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy build artifacts from standalone output
COPY --from=builder /app/apps/web-client/.next/standalone ./
COPY --from=builder /app/apps/web-client/.next/static ./apps/web-client/.next/static
COPY --from=builder /app/apps/web-client/public ./apps/web-client/public

EXPOSE 3000

CMD ["node", "apps/web-client/server.js"]
