import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const user = process.env.DB_USER ?? "postgres"
  const password = process.env.DB_PASSWORD ?? "postgres"
  const host = process.env.DB_HOST ?? "localhost"
  const port = process.env.DB_PORT ?? "5432"
  const database = process.env.DB_NAME ?? "pcf_dashboard"

  return `postgresql://${user}:${password}@${host}:${port}/${database}`
}

function createPrismaClient() {
  const adapter = new PrismaPg(getDatabaseUrl())
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
