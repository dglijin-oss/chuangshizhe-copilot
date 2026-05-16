import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const parsed = new URL(databaseUrl);

const adapter = new PrismaPg({
  host: parsed.hostname,
  port: parseInt(parsed.port, 10),
  database: parsed.pathname.slice(1),
  user: parsed.username,
  password: parsed.password,
  ssl: false,
  // 限制连接池大小，本地开发避免爆内存
  max: parseInt(process.env.PG_POOL_MAX || "5", 10),
  idleTimeoutMillis: 30_000,
});

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
