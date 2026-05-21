FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN echo "node-linker=hoisted" > .npmrc
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY apps/ip-copilot/package.json ./apps/ip-copilot/
COPY apps/edu-box/package.json ./apps/edu-box/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV SKIP_ENV_VALIDATION=1

# Generate all Prisma clients
RUN cd packages/database && npx prisma generate --schema=schema-core.prisma
RUN cd packages/database && npx prisma generate --schema=schema-ip.prisma
RUN cd packages/database && npx prisma generate --schema=schema-edu.prisma

# Build both apps
RUN cd apps/ip-copilot && npx next build --webpack
RUN cd apps/edu-box && npx next build --webpack

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# IP Copilot files
COPY --from=builder /app/apps/ip-copilot/public ./apps/ip-copilot/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/ip-copilot/.next/standalone ./apps/ip-copilot/standalone
COPY --from=builder --chown=nextjs:nodejs /app/apps/ip-copilot/.next/static ./apps/ip-copilot/.next/static

# Edu Box files
COPY --from=builder /app/apps/edu-box/public ./apps/edu-box/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/edu-box/.next/standalone ./apps/edu-box/standalone
COPY --from=builder --chown=nextjs:nodejs /app/apps/edu-box/.next/static ./apps/edu-box/.next/static

# Startup script for both apps
COPY --chown=nextjs:nodejs <<'EOF' /app/start.sh
#!/bin/sh
cd /app/apps/ip-copilot/standalone
node server.js &
cd /app/apps/edu-box/standalone
node server.js &
wait
EOF

RUN chmod +x /app/start.sh

USER nextjs
EXPOSE 3000 3001
ENV HOSTNAME="0.0.0.0"

CMD ["/app/start.sh"]
