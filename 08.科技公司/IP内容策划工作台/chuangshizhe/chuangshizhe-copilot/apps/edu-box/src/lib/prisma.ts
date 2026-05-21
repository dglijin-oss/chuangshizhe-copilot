import { PrismaClient as PrismaClientCore } from "@chuangshizhe/database/client-core"
import { PrismaClient as PrismaClientEdu } from "@chuangshizhe/database/client-edu"
import { PrismaPg } from "@prisma/adapter-pg"
import "@/lib/env"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

const globalForPrisma = globalThis as unknown as {
  prismaCore: PrismaClientCore
  prismaEdu: PrismaClientEdu
}

export const prismaCore = globalForPrisma.prismaCore || new PrismaClientCore({ adapter })
export const prismaEdu = globalForPrisma.prismaEdu || new PrismaClientEdu({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaCore = prismaCore
  globalForPrisma.prismaEdu = prismaEdu
}
