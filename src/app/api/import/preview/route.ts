import { NextResponse } from "next/server"
import {
  buildExistingActivityKeys,
  getActiveEmissionFactors,
  getFactorMatches,
  parseWorkbook,
  summarizeImportRows,
  validateImportRows,
} from "@/lib/upload/import"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Excel 파일이 필요합니다." }, { status: 400 })
    }

    const parsed = parseWorkbook(await file.arrayBuffer())
    const [factors, factorMatches, existingKeys] = await Promise.all([
      getActiveEmissionFactors(),
      getFactorMatches(),
      buildExistingActivityKeys(),
    ])
    const rows = validateImportRows(parsed.rows, factorMatches, existingKeys)

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
