# ---- Stage 1: Build ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma/ ./prisma/
COPY prisma.config.ts ./

# Generate Prisma client (build-time)
RUN npx prisma generate

COPY . .

# Build the Next.js app
RUN npm run build

# ---- Stage 2: Production ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx next start -p 3000"]
