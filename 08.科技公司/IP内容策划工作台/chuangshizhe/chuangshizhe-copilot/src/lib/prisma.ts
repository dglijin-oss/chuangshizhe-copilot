import { PrismaClient as PrismaClientCore } from "@chuangshizhe/database/client-core/client"
import { PrismaClient as PrismaClientIp } from "@chuangshizhe/database/client-ip/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "@/lib/env"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

const globalForPrisma = globalThis as unknown as {
  prismaCore: PrismaClientCore
  prismaIp: PrismaClientIp
}

export const prismaCore = globalForPrisma.prismaCore || new PrismaClientCore({ adapter })
export const prismaIp = globalForPrisma.prismaIp || new PrismaClientIp({ adapter })

// Alias for backward compatibility
export const prisma = prismaCore
