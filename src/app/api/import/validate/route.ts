import { NextResponse } from "next/server"
import { z } from "zod"
import {
  buildExistingActivityKeys,
  getActiveEmissionFactors,
  getFactorMatches,
  getImportMappings,
  summarizeImportRows,
  validateImportRows,
} from "@/lib/upload/import"
import type { ColumnMapping, ImportRow } from "@/lib/upload/types"

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rows = z.array(ImportRowSchema).parse(body.rows) as ImportRow[]
    const mappings: ColumnMapping[] = Array.isArray(body.mappings) ? body.mappings : getImportMappings()
    const sourceHeaders: string[] = Array.isArray(body.sourceHeaders) ? body.sourceHeaders : []
    const [factors, factorMatches, existingKeys] = await Promise.all([
      getActiveEmissionFactors(),
      getFactorMatches(),
      buildExistingActivityKeys(),
    ])
    const validatedRows = validateImportRows(rows, factorMatches, existingKeys)

    return NextResponse.json({
      fileName: body.fileName ?? "edited-preview",
      sheetName: body.sheetName ?? "과제용 데이터",
      mappings,
      sourceHeaders,
      rows: validatedRows,
      summary: summarizeImportRows(validatedRows),
      factors,
    })
  } catch (error) {
    console.error("Failed to validate staff import", error)
    return NextResponse.json({ error: "검증할 행 데이터가 올바르지 않습니다." }, { status: 400 })
  }
}
