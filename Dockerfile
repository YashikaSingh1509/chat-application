# Stage 1: Build
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy application configuration and source code
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Compile NestJS application
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies to keep the image lightweight
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/i18n ./src/i18n

# Expose HTTP REST and Socket.IO port
EXPOSE 3005

# Healthcheck to verify backend responsiveness
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/admin/api/v1', (r) => { if (r.statusCode < 500) process.exit(0); process.exit(1); })" || exit 1

# Launch application
CMD ["node", "dist/main"]