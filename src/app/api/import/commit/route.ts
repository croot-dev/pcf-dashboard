import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  buildExistingActivityKeys,
  ensureProduct,
  getFactorMatches,
  getParsedAmount,
  getParsedDate,
  summarizeImportRows,
  validateImportRows,
} from "@/lib/upload/import"
import type { ImportRow } from "@/lib/upload/types"

export const dynamic = "force-dynamic"

const ImportRowSchema = z.object({
  id: z.string(),
  rowNumber: z.number(),
  date: z.string(),
  activityType: z.string(),
  sourceName: z.string(),
  amount: z.string(),
  unit: z.string(),
  productCode: z.string(),
  productName: z.string(),
  emissionFactorId: z.string().nullable(),
  factor: z.number().nullable(),
  co2e: z.number().nullable(),
  status: z.enum(["valid", "warning", "error"]),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  raw: z.record(z.string(), z.unknown()),
})

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function monthEnd(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
}

async function findOrCreateBatch(productId: string, date: Date) {
  const periodStart = monthStart(date)
  const periodEnd = monthEnd(date)
  const existing = await prisma.productionBatch.findFirst({
    where: {
      productId,
      periodStart,
      periodEnd,
      deletedAt: null,
    },
  })

  if (existing) return existing

  return prisma.productionBatch.create({
    data: {
      productId,
      producedQuantity: 1000,
      periodStart,
      periodEnd,
    },
  })
}

async function findExistingActivity(row: ImportRow, productId: string, date: Date) {
  return prisma.activityData.findFirst({
    where: {
      productId,
      date,
      activityType: row.activityType,
      unit: row.unit,
      deletedAt: null,
      emissionFactor: {
        sourceName: row.sourceName,
      },
    },
    include: {
      emission: true,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rows = z.array(ImportRowSchema).parse(body.rows) as ImportRow[]
    const [factorMatches, existingKeys] = await Promise.all([
      getFactorMatches(),
      buildExistingActivityKeys(),
    ])
    const validatedRows = validateImportRows(rows, factorMatches, existingKeys)
    const importableRows = validatedRows.filter((row) => row.status !== "error")

    let saved = 0
    let updated = 0

    for (const row of importableRows) {
      const date = getParsedDate(row)
      const amount = getParsedAmount(row)
      const factor = row.factor

      if (!date || !row.emissionFactorId || factor === null || row.co2e === null) continue

      const product = await ensureProduct(row.productCode, row.productName)
      const batch = await findOrCreateBatch(product.id, date)
      const existing = await findExistingActivity(row, product.id, date)

      const activityData = {
        productId: product.id,
        emissionFactorId: row.emissionFactorId,
        batchId: batch.id,
        activityType: row.activityType,
        amount,
        unit: row.unit,
        date,
        rawDataJson: {
          ...row.raw,
          source: "staff-import",
          rowNumber: row.rowNumber,
        },
        deletedAt: null,
      }

      if (existing) {
        await prisma.activityData.update({
          where: { id: existing.id },
          data: activityData,
        })
        await prisma.emission.upsert({
          where: { activityDataId: existing.id },
          create: {
            activityDataId: existing.id,
            emissionFactorId: row.emissionFactorId,
            co2e: row.co2e,
          },
          update: {
            emissionFactorId: row.emissionFactorId,
            co2e: row.co2e,
            deletedAt: null,
          },
        })
        updated += 1
      } else {
        const created = await prisma.activityData.create({ data: activityData })
        await prisma.emission.create({
          data: {
            activityDataId: created.id,
            emissionFactorId: row.emissionFactorId,
            co2e: row.co2e,
          },
        })
        saved += 1
      }
    }

    return NextResponse.json({
      saved,
      updated,
      skipped: validatedRows.length - importableRows.length,
      summary: summarizeImportRows(validatedRows),
      rows: validatedRows,
    })
  } catch (error) {
    console.error("Failed to commit staff import", error)
    return NextResponse.json({ error: "검증 통과 행을 저장하지 못했습니다." }, { status: 500 })
  }
}
