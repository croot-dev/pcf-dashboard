import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const user = process.env.DB_USER ?? "postgres"
  const password = process.env.DB_PASSWORD ?? "postgres"
  const host = process.env.DB_HOST ?? "localhost"
  const port = process.env.DB_PORT ?? "5432"
  const database = process.env.DB_NAME ?? "pcf_dashboard"

  return `postgresql://${user}:${password}@${host}:${port}/${database}`
}

const adapter = new PrismaPg(getDatabaseUrl())
const prisma = new PrismaClient({ adapter })

// 배출계수 — Excel "과제용 데이터" 기준값 반영
const FACTORS = {
  electricity: {
    id: "00000000-0000-4000-8000-000000000101",
    activityType: "전기",
    scope: "2",
    sourceName: "한국전력",
    region: "한국",
    unit: "kWh",
    factor: 0.456,
    methodology: "GHG Protocol / 한국 전력 배출계수 2023",
  },
  plastic1: {
    id: "00000000-0000-4000-8000-000000000108",
    activityType: "원소재",
    scope: "3",
    sourceName: "플라스틱 1",
    region: null,
    unit: "kg",
    factor: 2.3,
    methodology: "ecoinvent 3.9",
  },
  plastic2: {
    id: "00000000-0000-4000-8000-000000000109",
    activityType: "원소재",
    scope: "3",
    sourceName: "플라스틱 2",
    region: null,
    unit: "kg",
    factor: 3.2,
    methodology: "ecoinvent 3.9",
  },
  truck: {
    id: "00000000-0000-4000-8000-000000000105",
    activityType: "운송",
    scope: "3",
    sourceName: "트럭",
    region: "한국",
    unit: "ton-km",
    factor: 3.5,
    methodology: "GHG Protocol / IPCC 2006",
  },
} as const

const PRODUCTS = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    code: "CT-045",
    name: "Carbon Tracker Module",
  },
] as const

// Excel "과제용 데이터" 시트 30건 — 원본 그대로
const ACTIVITY_ROWS = [
  // 전기
  { date: "2025-01-01", activityType: "전기",   description: "한국전력",  amount: 110, unit: "kWh"    },
  { date: "2025-02-01", activityType: "전기",   description: "한국전력",  amount: 112, unit: "kWh"    },
  { date: "2025-03-01", activityType: "전기",   description: "한국전력",  amount: 115, unit: "kWh"    },
  { date: "2025-04-01", activityType: "전기",   description: "한국전력",  amount: 130, unit: "kWh"    },
  { date: "2025-05-01", activityType: "전기",   description: "한국전력",  amount: 120, unit: "kWh"    },
  { date: "2025-06-01", activityType: "전기",   description: "한국전력",  amount: 110, unit: "kWh"    },
  { date: "2025-07-01", activityType: "전기",   description: "한국전력",  amount: 120, unit: "kWh"    },
  { date: "2025-08-01", activityType: "전기",   description: "한국전력",  amount: 111, unit: "kWh"    },
  { date: "2025-05-01", activityType: "전기",   description: "한국전력",  amount: 101, unit: "kWh"    },
  // 원소재
  { date: "2025-01-01", activityType: "원소재", description: "플라스틱 1", amount: 230, unit: "kg"    },
  { date: "2025-02-01", activityType: "원소재", description: "플라스틱 1", amount: 340, unit: "kg"    },
  { date: "2025-03-01", activityType: "원소재", description: "플라스틱 2", amount:  23, unit: "kg"    },
  { date: "2025-03-01", activityType: "원소재", description: "플라스틱 1", amount: 430, unit: "kg"    },
  { date: "2025-04-01", activityType: "원소재", description: "플라스틱 1", amount: 510, unit: "kg"    },
  { date: "2025-05-01", activityType: "원소재", description: "플라스틱 1", amount: 424, unit: "kg"    },
  { date: "2025-05-01", activityType: "원소재", description: "플라스틱 2", amount:  40, unit: "kg"    },
  { date: "2025-06-01", activityType: "원소재", description: "플라스틱 1", amount: 450, unit: "kg"    },
  { date: "2025-07-01", activityType: "원소재", description: "플라스틱 1", amount: 340, unit: "kg"    },
  { date: "2025-07-01", activityType: "원소재", description: "플라스틱 2", amount:  43, unit: "kg"    },
  { date: "2025-08-01", activityType: "원소재", description: "플라스틱 1", amount: 230, unit: "kg"    },
  { date: "2025-05-01", activityType: "원소재", description: "플라스틱 1", amount: 232, unit: "kg"    },
  // 운송
  { date: "2025-01-01", activityType: "운송",   description: "트럭",      amount:  41, unit: "ton-km" },
  { date: "2025-02-01", activityType: "운송",   description: "트럭",      amount: 211, unit: "ton-km" },
  { date: "2025-03-01", activityType: "운송",   description: "트럭",      amount: 123, unit: "ton-km" },
  { date: "2025-04-01", activityType: "운송",   description: "트럭",      amount:  42, unit: "ton-km" },
  { date: "2025-05-01", activityType: "운송",   description: "트럭",      amount: 123, unit: "ton-km" },
  { date: "2025-06-01", activityType: "운송",   description: "트럭",      amount: 123, unit: "ton-km" },
  { date: "2025-07-01", activityType: "운송",   description: "트럭",      amount:  41, unit: "ton-km" },
  { date: "2025-08-01", activityType: "운송",   description: "트럭",      amount: 123, unit: "ton-km" },
  { date: "2025-05-01", activityType: "운송",   description: "트럭",      amount:  12, unit: "ton-km" },
] as const

type FactorKey = keyof typeof FACTORS
const DESCRIPTION_TO_FACTOR_KEY: Record<string, FactorKey> = {
  "한국전력":  "electricity",
  "플라스틱 1": "plastic1",
  "플라스틱 2": "plastic2",
  "트럭":      "truck",
}

const MONTHS = [
  "2025-01", "2025-02", "2025-03", "2025-04",
  "2025-05", "2025-06", "2025-07", "2025-08",
] as const

function date(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function monthEnd(month: string) {
  const [year, monthNum] = month.split("-").map(Number)
  return new Date(Date.UTC(year, monthNum, 0))
}

function round(value: number, digits: number) {
  return Number(value.toFixed(digits))
}

function seedUuid(group: string, index: number) {
  return `00000000-0000-4000-8000-${group}${String(index).padStart(11, "0")}`
}

async function seedEmissionFactors() {
  for (const factor of Object.values(FACTORS)) {
    await prisma.emissionFactor.upsert({
      where: { id: factor.id },
      create: {
        ...factor,
        validFrom: date("2023-01-01"),
        validTo: null,
      },
      update: {
        activityType: factor.activityType,
        scope: factor.scope,
        sourceName: factor.sourceName,
        region: factor.region,
        unit: factor.unit,
        factor: factor.factor,
        methodology: factor.methodology,
        validFrom: date("2023-01-01"),
        validTo: null,
        deletedAt: null,
      },
    })
  }
}

async function seedProducts() {
  for (const product of PRODUCTS) {
    await prisma.product.upsert({
      where: { code: product.code },
      create: product,
      update: {
        name: product.name,
        deletedAt: null,
      },
    })
  }
}

async function seedProductionAndActivities() {
  const productId = PRODUCTS[0].id // CT-045 — Excel 헤더에 명시

  // 월별 ProductionBatch (2025-01 ~ 2025-08)
  const batchIdByMonth: Record<string, string> = {}

  for (let i = 0; i < MONTHS.length; i += 1) {
    const month = MONTHS[i]
    const batchId = seedUuid("3", i + 1)
    batchIdByMonth[month] = batchId

    await prisma.productionBatch.upsert({
      where: { id: batchId },
      create: {
        id: batchId,
        productId,
        producedQuantity: 900 + i * 75,
        periodStart: date(`${month}-01`),
        periodEnd: monthEnd(month),
      },
      update: {
        productId,
        producedQuantity: 900 + i * 75,
        periodStart: date(`${month}-01`),
        periodEnd: monthEnd(month),
        deletedAt: null,
      },
    })
  }

  // 30건 ActivityData + Emission
  for (let i = 0; i < ACTIVITY_ROWS.length; i += 1) {
    const row = ACTIVITY_ROWS[i]
    const factorKey = DESCRIPTION_TO_FACTOR_KEY[row.description]
    const factor = FACTORS[factorKey]
    const month = row.date.slice(0, 7)
    const batchId = batchIdByMonth[month]
    const activityId = seedUuid("4", i + 1)
    const emissionId = seedUuid("5", i + 1)
    const co2e = round(Number(row.amount) * Number(factor.factor), 4)

    await prisma.activityData.upsert({
      where: { id: activityId },
      create: {
        id: activityId,
        productId,
        emissionFactorId: factor.id,
        batchId,
        activityType: row.activityType,
        amount: row.amount,
        unit: row.unit,
        date: date(row.date),
        rawDataJson: {
          source: "excel",
          sheetName: "과제용 데이터",
          description: row.description,
        },
      },
      update: {
        productId,
        emissionFactorId: factor.id,
        batchId,
        activityType: row.activityType,
        amount: row.amount,
        unit: row.unit,
        date: date(row.date),
        rawDataJson: {
          source: "excel",
          sheetName: "과제용 데이터",
          description: row.description,
        },
        deletedAt: null,
      },
    })

    await prisma.emission.upsert({
      where: { activityDataId: activityId },
      create: {
        id: emissionId,
        activityDataId: activityId,
        emissionFactorId: factor.id,
        co2e,
      },
      update: {
        emissionFactorId: factor.id,
        co2e,
        deletedAt: null,
      },
    })
  }
}

async function main() {
  await seedEmissionFactors()
  await seedProducts()
  await seedProductionAndActivities()

  console.log("Seed complete.")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
