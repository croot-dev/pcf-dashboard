import { NextResponse } from "next/server"
import { summarizeImportRows } from "@/lib/upload"
import {
  buildExistingActivityKeys,
  getActiveEmissionFactors,
  getFactorMatches,
  parseWorkbook,
  validateImportRows,
} from "@/lib/upload/import"

export const dynamic = "force-dynamic"

/**
 * @swagger
 * /api/import/preview:
 *   post:
 *     tags:
 *       - Import
 *     summary: Excel 파일 미리보기 및 1차 검증
 *     description: >
 *       과제용 Excel 파일을 업로드하면 시트를 파싱하고, 기본 컬럼 매핑과 배출계수 매칭 결과를 포함한
 *       미리보기 데이터를 반환합니다. 저장은 수행하지 않습니다.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 업로드할 Excel 파일입니다.
 *     responses:
 *       200:
 *         description: Excel 파싱 및 검증 결과
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ImportPreviewResponse"
 *       400:
 *         description: Excel 파일 누락
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Excel 파싱 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Excel 파일이 필요합니다." }, { status: 400 })
    }

    const parsed = await parseWorkbook(await file.arrayBuffer())
    const [factors, factorMatches, existingKeys] = await Promise.all([
      getActiveEmissionFactors(),
      getFactorMatches(),
      buildExistingActivityKeys(),
    ])
    const rows = await validateImportRows(parsed.rows, factorMatches, existingKeys)

    return NextResponse.json({
      fileName: file.name,
      sheetName: parsed.sheetName,
      mappings: parsed.mappings,
      sourceHeaders: parsed.sourceHeaders,
      rows,
      summary: summarizeImportRows(rows),
      factors,
    })
  } catch (error) {
    console.error("Failed to preview import", error)
    return NextResponse.json({ error: "Excel 파일을 파싱하지 못했습니다." }, { status: 500 })
  }
}
