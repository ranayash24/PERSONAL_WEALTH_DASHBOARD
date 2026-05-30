import { PrismaClient } from '@prisma/client'
import { MOCK_ASSETS, MOCK_USER_SETTINGS } from '@/lib/mock-data'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const realDb =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = realDb

const mockDb = {
  asset: {
    findMany: async (opts?: any) => {
      const includeValuations = opts?.include?.valuations
      const selectOnly = opts?.select
      return MOCK_ASSETS.map((a) => {
        if (selectOnly) {
          const result: any = {}
          for (const key of Object.keys(selectOnly)) result[key] = (a as any)[key]
          return result
        }
        return { ...a, valuations: includeValuations ? [...a.valuations].reverse() : undefined }
      })
    },
    findUnique: async () => null,
    create: async () => ({ ...MOCK_ASSETS[0], id: 'demo' }),
    update: async () => MOCK_ASSETS[0],
    delete: async () => MOCK_ASSETS[0],
    deleteMany: async () => ({ count: 0 }),
    count: async () => MOCK_ASSETS.length,
  },
  userSettings: {
    findUnique: async () => MOCK_USER_SETTINGS,
    create: async () => MOCK_USER_SETTINGS,
    update: async () => MOCK_USER_SETTINGS,
    upsert: async () => MOCK_USER_SETTINGS,
  },
  user: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async () => null,
    update: async () => null,
    delete: async () => null,
    deleteMany: async () => ({ count: 0 }),
  },
  valuation: {
    findMany: async () => [],
    create: async () => null,
    deleteMany: async () => ({ count: 0 }),
  },
  import: {
    findMany: async () => [],
    create: async () => null,
    update: async () => null,
    deleteMany: async () => ({ count: 0 }),
  },
  $disconnect: async () => {},
  $connect: async () => {},
} as unknown as PrismaClient

export const db: PrismaClient =
  process.env.DEMO_MODE === 'true' ? mockDb : realDb
