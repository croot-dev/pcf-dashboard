import { NextResponse } from "next/server"
import { z } from "zod"
import { summarizeImportRows } from "@/lib/upload"
import { ImportRowSchema } from "@/lib/upload/schemas"
import {
  buildExistingActivityKeys,
  getActiveEmissionFactors,
  getFactorMatches,
  getImportMappings,
  validateImportRows,
} from "@/lib/upload/import"
import type { ColumnMapping, ImportRow } from "@/lib/upload"

export const dynamic = "force-dynamic"

/**
 * @swagger
 * /api/import/validate:
 *   post:
 *     tags:
 *       - Import
 *     summary: 편집된 Excel 행 재검증
 *     description: >
 *       미리보기 또는 사용자가 수정한 import rows를 다시 검증합니다.
 *       배출계수 매칭, 중복 여부, 필수값, 날짜, 수량 오류를 반영한 최신 검증 결과를 반환합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ImportValidationRequest"
 *     responses:
 *       200:
 *         description: 재검증된 import rows
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ImportPreviewResponse"
 *       400:
 *         description: 요청 데이터 검증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rows = z.array(ImportRowSchema).parse(body.rows) as ImportRow[]
    const mappings: ColumnMapping[] = Array.isArray(body.mappings) ? body.mappings : await getImportMappings()
    const sourceHeaders: string[] = Array.isArray(body.sourceHeaders) ? body.sourceHeaders : []
    const [factors, factorMatches, existingKeys] = await Promise.all([
      getActiveEmissionFactors(),
      getFactorMatches(),
      buildExistingActivityKeys(),
    ])
    const validatedRows = await validateImportRows(rows, factorMatches, existingKeys)

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
