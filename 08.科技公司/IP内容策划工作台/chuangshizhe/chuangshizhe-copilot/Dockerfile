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
COPY --from=builder --chown=nextjs:nodejs /app/apps/ip-copilot/.next/static ./apps/ip-copilot/.next/static

# Copy workspace package for externalized @chuangshizhe/database.
# Its generated clients depend on @prisma/client-runtime-utils, so we copy
# the entire @prisma namespace first.
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/packages/database ./node_modules/@chuangshizhe/database
# Copy pg and its nested deps (hoisted by pnpm)
COPY --from=builder /app/node_modules/pg ./node_modules/pg
# Copy .pnpm for transitive deps not hoisted to root
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/ip-copilot/server.js"]
