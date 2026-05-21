FROM node:20-alpine AS base
# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@9 --activate

# Install dependencies
FROM base AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY apps/ip-copilot/package.json ./apps/ip-copilot/
RUN pnpm install --frozen-lockfile

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/apps/ip-copilot/node_modules ./apps/ip-copilot/node_modules
COPY . .
ENV SKIP_ENV_VALIDATION=1

# Generate Prisma clients
RUN cd packages/database && npx prisma generate --schema=schema-core.prisma
RUN cd packages/database && npx prisma generate --schema=schema-ip.prisma

# Build the app using webpack (Turbopack has issues with Prisma workspace packages)
RUN cd apps/ip-copilot && npx next build --webpack

# Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/ip-copilot/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/ip-copilot/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/ip-copilot/.next/static ./.next/static

# Copy workspace package to node_modules so webpack externalized requires resolve.
# Must copy @prisma/* and pg BEFORE @chuangshizhe/database, since database's
# package.json depends on @prisma/client.
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/@prisma/client-runtime-utils ./node_modules/@prisma/client-runtime-utils
COPY --from=builder /app/node_modules/@prisma/adapter-pg ./node_modules/@prisma/adapter-pg
COPY --from=builder /app/node_modules/pg ./node_modules/pg
COPY --from=builder /app/node_modules/pg-cloudflare ./node_modules/pg-cloudflare
COPY --from=builder /app/node_modules/pg-protocol ./node_modules/pg-protocol
COPY --from=builder /app/node_modules/pg-types ./node_modules/pg-types
COPY --from=builder /app/node_modules/pgpass ./node_modules/pgpass
COPY --from=builder /app/node_modules/postgres-array ./node_modules/postgres-array
COPY --from=builder /app/node_modules/postgres-bytea ./node_modules/postgres-bytea
COPY --from=builder /app/node_modules/postgres-date ./node_modules/postgres-date
COPY --from=builder /app/node_modules/postgres-interval ./node_modules/postgres-interval
COPY --from=builder /app/node_modules/pg-int8 ./node_modules/pg-int8
COPY --from=builder /app/packages/database ./node_modules/@chuangshizhe/database

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
