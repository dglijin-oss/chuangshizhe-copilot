import { PrismaClient as PrismaClientCore } from "@chuangshizhe/database/client-core"
import { PrismaClient as PrismaClientIp } from "@chuangshizhe/database/client-ip"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

const globalForPrisma = globalThis as unknown as {
  prismaCore?: PrismaClientCore
  prismaIp?: PrismaClientIp
}

export const prismaCore = globalForPrisma.prismaCore ?? new PrismaClientCore({ adapter })
export const prismaIp = globalForPrisma.prismaIp ?? new PrismaClientIp({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaCore = prismaCore
  globalForPrisma.prismaIp = prismaIp
}
