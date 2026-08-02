# Stage 1: Build stage
FROM oven/bun:1.1.14 AS builder
WORKDIR /app
ENV CI=true

# Install pnpm and nodejs for Vite build and client TypeScript compilation
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g pnpm

# Copy monorepo configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/client/package.json ./apps/client/
COPY apps/server/package.json ./apps/server/
COPY packages/types/package.json ./packages/types/
COPY packages/db/package.json ./packages/db/
COPY packages/engine/package.json ./packages/engine/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy codebase
COPY . .

# Build client and bundle server
RUN pnpm --filter @studyou/client build
RUN cd apps/server && bun build src/node.ts --target node --outdir ../../deploy && cd ../..
RUN cp -r apps/client/dist deploy/client-dist
RUN cat > deploy/package.json <<'PKG'
{
  "name": "studyou-deploy",
  "private": true,
  "type": "module",
  "scripts": { "start": "node node.js" }
}
PKG

# Stage 2: Runtime stage
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/deploy ./
ENV PORT=8080
EXPOSE 8080
CMD ["node", "node.js"]
