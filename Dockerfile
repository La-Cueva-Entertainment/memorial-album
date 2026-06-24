# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

# Install ALL deps (including devDeps for the build)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Provide a placeholder DB URL so the build succeeds without a mounted volume
ENV DATABASE_URL=file:/tmp/build.db
RUN npm run build

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install only production deps (prisma is now in dependencies, so it's included)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# Copy built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# User uploads + database live here — mount as a Docker volume
VOLUME /app/data

EXPOSE 3000
ENV PORT=3000

# On startup: push schema to DB (creates tables if first run), then start Next.js
CMD ["/bin/sh", "-c", "DATABASE_URL=${DATABASE_URL:-file:./data/dev.db} npx prisma db push --skip-generate 2>/dev/null; exec npm start"]
