FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN echo "node-linker=hoisted" > .npmrc
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY apps/ip-copilot/package.json ./apps/ip-copilot/
RUN pnpm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV SKIP_ENV_VALIDATION=1

# Generate all Prisma clients
# Use full path since pnpm hoisted node_modules is at root
RUN node /app/node_modules/prisma/build/index.js generate --schema=/app/packages/database/schema-core.prisma
RUN node /app/node_modules/prisma/build/index.js generate --schema=/app/packages/database/schema-ip.prisma

# Build IP Copilot
RUN cd apps/ip-copilot && npx next build --webpack

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/ip-copilot/public ./apps/ip-copilot/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/ip-copilot/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/ip-copilot/.next/static ./apps/ip-copilot/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/ip-copilot/server.js"]
