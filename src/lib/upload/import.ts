import * as XLSX from "xlsx"
import dayjs from "@/lib/dayjs"
import { prisma } from "@/lib/prisma"
import type {
  ColumnMapping,
  ImportRow,
  ImportSummary,
  ImportStatus,
  OperEmissionFactor,
} from "@/lib/upload/types"
import { MAPPINGS } from "@/lib/upload/constants"
export { MAPPINGS }

const ERR_DATE_FORMAT    = "날짜는 YYYY-MM-DD 형식이어야 합니다."
const ERR_ACTIVITY_TYPE  = "활동 유형은 필수입니다."
const ERR_SOURCE_NAME    = "배출원은 필수입니다."
const ERR_UNIT           = "단위는 필수입니다."
const ERR_AMOUNT         = "사용량은 0 이상의 숫자여야 합니다."
const ERR_NO_FACTOR      = "활동 유형, 배출원, 단위, 날짜에 맞는 배출계수가 없습니다."

const WARN_BATCH_DUPLICATE = "업로드 파일 안에 중복 후보가 있습니다."
const WARN_DB_EXISTS       = "DB에 같은 날짜/활동/배출원/단위 데이터가 있어 저장 시 업데이트됩니다."

const FIELD_LABELS = {
  date: "일자",
  activityType: "활동 유형",
  sourceName: "설명",
  amount: "량",
  unit: "단위",
} as const

const HEADER_ALIASES: Record<keyof typeof FIELD_LABELS, string[]> = {
  date: ["일자", "일자원본", "날짜", "date", "activitydate", "사용일자"],
  activityType: ["활동유형", "활동", "구분", "유형", "activitytype", "category"],
  sourceName: ["설명", "상세", "배출원", "항목", "source", "sourcename", "description"],
  amount: ["량", "양", "수량", "사용량", "투입량", "amount", "quantity", "usage"],
  unit: ["단위", "unit", "uom"],
}

type ImportField = keyof typeof FIELD_LABELS

type FactorMatch = {
  id: string
  activityType: string
  sourceName: string
  scope: string
  unit: string
  factor: unknown
  validFrom: Date
  validTo: Date | null
}

type ExistingActivityKey = {
  date: string
  activityType: string
  sourceName: string
  unit: string
}

type DetectedColumns = Partial<Record<ImportField, number>>

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()[\]{}·_\-/]/g, "")
}

function isRowMostlyEmpty(row: unknown[]) {
  return row.every((cell) => String(cell ?? "").trim() === "")
}

function getCell(row: unknown[], index: number | undefined) {
  if (index === undefined) return ""
  return row[index]
}

function findColumnIndex(headerRow: unknown[], field: ImportField) {
  const aliases = HEADER_ALIASES[field]

  for (let index = 0; index < headerRow.length; index += 1) {
    const normalized = normalizeHeader(headerRow[index])
    if (!normalized) continue
    if (aliases.some((alias) => normalized === normalizeHeader(alias))) return index
  }

  for (let index = 0; index < headerRow.length; index += 1) {
    const normalized = normalizeHeader(headerRow[index])
    if (!normalized) continue
    if (aliases.some((alias) => normalized.includes(normalizeHeader(alias)))) return index
  }

  return undefined
}

function scoreHeaderRow(headerRow: unknown[]) {
  const columns: DetectedColumns = {}
  let score = 0

  for (const field of Object.keys(FIELD_LABELS) as ImportField[]) {
    const index = findColumnIndex(headerRow, field)
    if (index !== undefined) {
      columns[field] = index
      score += 1
    }
  }

  return { score, columns }
}

function detectHeader(matrix: unknown[][]) {
  let best = {
    rowIndex: -1,
    score: 0,
    columns: {} as DetectedColumns,
  }

  for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
    const result = scoreHeaderRow(matrix[rowIndex])
    if (result.score > best.score) {
      best = {
        rowIndex,
        score: result.score,
        columns: result.columns,
      }
    }
  }

  return best
}

function buildMappings(headerRow: unknown[], columns: DetectedColumns): ColumnMapping[] {
  return (Object.keys(FIELD_LABELS) as ImportField[]).map((field) => {
    const columnIndex = columns[field]
    const source =
      columnIndex === undefined
        ? `${FIELD_LABELS[field]} 컬럼 미감지`
        : String(headerRow[columnIndex] ?? FIELD_LABELS[field]).trim()

    return {
      source,
      target: field,
    }
  })
}

function missingColumnErrors(columns: DetectedColumns) {
  return (Object.keys(FIELD_LABELS) as ImportField[])
    .filter((field) => columns[field] === undefined)
    .map((field) => `${FIELD_LABELS[field]} 컬럼을 자동으로 찾지 못했습니다.`)
}

function toDateString(value: unknown) {
  if (value instanceof Date) return dayjs.utc(value).format("YYYY-MM-DD")
  return String(value ?? "").trim()
}

function toIsoDate(date: Date) {
  return dayjs.utc(date).format("YYYY-MM-DD")
}

function toNumber(value: string) {
  const normalized = value.replace(/,/g, "").trim()
  if (normalized === "") return Number.NaN
  return Number(normalized)
}

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits))
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

  const d = dayjs.utc(value)
  if (!d.isValid()) return null

  return d.toDate()
}

function findFactor(row: ImportRow, factors: FactorMatch[]) {
  const date = parseDate(row.date)
  if (!date) return null

  return (
    factors.find((f) => {
      if (f.activityType !== row.activityType) return false
      if (f.sourceName !== row.sourceName) return false
      if (f.unit !== row.unit) return false
      if (f.validFrom > date) return false
      if (f.validTo && f.validTo < date) return false
      return true
    }) ?? null
  )
}

function getStatus(errors: string[], warnings: string[]): ImportStatus {
  if (errors.length > 0) return "error"
  if (warnings.length > 0) return "warning"
  return "valid"
}

function buildExistingKey(row: ExistingActivityKey) {
  return [row.date, row.activityType, row.sourceName, row.unit].join("|")
}

export function summarizeImportRows(rows: ImportRow[]): ImportSummary {
  return {
    total: rows.length,
    valid: rows.filter((row) => row.status === "valid").length,
    warning: rows.filter((row) => row.status === "warning").length,
    error: rows.filter((row) => row.status === "error").length,
    duplicate: rows.filter((row) => row.warnings.some((warning) => warning.includes("중복"))).length,
  }
}

export function toOperEmissionFactor(factor: FactorMatch): OperEmissionFactor {
  return {
    id: factor.id,
    activityType: factor.activityType,
    sourceName: factor.sourceName,
    scope: Number(String(factor.scope).replace(/scope/i, "").trim()) as 1 | 2 | 3,
    unit: factor.unit,
    factor: Number(factor.factor),
    validFrom: toIsoDate(factor.validFrom),
    validTo: factor.validTo ? toIsoDate(factor.validTo) : null,
  }
}

export async function getActiveEmissionFactors() {
  const factors = await prisma.emissionFactor.findMany({
    where: { deletedAt: null },
    orderBy: [{ activityType: "asc" }, { sourceName: "asc" }, { validFrom: "desc" }],
  })

  return factors.map(toOperEmissionFactor)
}

export async function getFactorMatches() {
  return prisma.emissionFactor.findMany({
    where: { deletedAt: null },
    orderBy: [{ validFrom: "desc" }],
  })
}

export async function buildExistingActivityKeys() {
  const existingRows = await prisma.activityData.findMany({
    where: { deletedAt: null },
    select: {
      date: true,
      activityType: true,
      unit: true,
      emissionFactor: {
        select: {
          sourceName: true,
        },
      },
    },
  })

  return new Set(
    existingRows.map((row) =>
      buildExistingKey({
        date: toIsoDate(row.date),
        activityType: row.activityType,
        sourceName: row.emissionFactor.sourceName,
        unit: row.unit,
      })
    )
  )
}

function findBestSheet(workbook: XLSX.WorkBook) {
  let bestSheetName = workbook.SheetNames[0]
  let bestMatrix: unknown[][] = []
  let bestDetected: ReturnType<typeof detectHeader> = { rowIndex: -1, score: 0, columns: {} }

  for (const sheetName of workbook.SheetNames) {
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
      raw: false,
      defval: "",
    })
    const detected = detectHeader(matrix)
    if (detected.score > bestDetected.score) {
      bestSheetName = sheetName
      bestMatrix = matrix
      bestDetected = detected
    }
  }

  return { sheetName: bestSheetName, matrix: bestMatrix, detected: bestDetected }
}

export function parseWorkbook(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false })
  const { sheetName, matrix, detected } = findBestSheet(workbook)
  const autoDetected = detected.score >= 3
  const headerRow = detected.rowIndex >= 0 ? matrix[detected.rowIndex] : []
  const mappings = autoDetected ? buildMappings(headerRow, detected.columns) : MAPPINGS
  const columns = autoDetected
    ? detected.columns
    : ({ date: 0, activityType: 1, sourceName: 2, amount: 3, unit: 4 } satisfies DetectedColumns)
  const dataStartIndex = autoDetected ? detected.rowIndex + 1 : 3
  const columnErrors = autoDetected ? missingColumnErrors(columns) : []

  const sourceHeaders = headerRow
    .map((h) => String(h ?? "").trim())
    .filter((h) => h !== "")

  const rows = matrix.slice(dataStartIndex).filter((row) => {
    if (isRowMostlyEmpty(row)) return false

    const hasActivityCells = (Object.keys(columns) as ImportField[]).some((field) => {
      return String(getCell(row, columns[field]) ?? "").trim() !== ""
    })

    return hasActivityCells
  })

  return {
    sheetName,
    mappings,
    sourceHeaders,
    rows: rows.map((row, index) => {
      const errors = [...columnErrors]

      return {
        id: `excel-${index + 1}`,
        rowNumber: dataStartIndex + index + 1,
        date: toDateString(getCell(row, columns.date)),
        activityType: String(getCell(row, columns.activityType) ?? "").trim(),
        sourceName: String(getCell(row, columns.sourceName) ?? "").trim(),
        amount: String(getCell(row, columns.amount) ?? "").trim(),
        unit: String(getCell(row, columns.unit) ?? "").trim(),
        productCode: "",
        productName: "",
        emissionFactorId: null,
        factor: null,
        co2e: null,
        status: getStatus(errors, []),
        errors,
        warnings: [],
        raw: Object.fromEntries(
          headerRow
            .map((h, i) => [String(h ?? "").trim(), row[i]] as [string, unknown])
            .filter(([key]) => key !== "")
        ),
      }
    }),
  }
}

export function validateImportRows(
  rows: ImportRow[],
  factors: FactorMatch[],
  existingKeys: Set<string>
): ImportRow[] {
  const seenKeys = new Set<string>()

  return rows.map((row) => {
    const errors: string[] = [...row.errors]
    const warnings: string[] = []
    const date = parseDate(row.date)
    const amount = toNumber(row.amount)

    if (!date) errors.push(ERR_DATE_FORMAT)
    if (!row.activityType) errors.push(ERR_ACTIVITY_TYPE)
    if (!row.sourceName) errors.push(ERR_SOURCE_NAME)
    if (!row.unit) errors.push(ERR_UNIT)
    if (!Number.isFinite(amount) || amount < 0) errors.push(ERR_AMOUNT)

    const factor = errors.length === 0 ? findFactor(row, factors) : null
    if (!factor && errors.length === 0) errors.push(ERR_NO_FACTOR)

    const key = buildExistingKey(row)
    if (seenKeys.has(key)) warnings.push(WARN_BATCH_DUPLICATE)
    if (existingKeys.has(key)) warnings.push(WARN_DB_EXISTS)
    seenKeys.add(key)

    return {
      ...row,
      emissionFactorId: factor?.id ?? null,
      factor: factor ? Number(factor.factor) : null,
      co2e: factor && Number.isFinite(amount) ? round(amount * Number(factor.factor)) : null,
      errors,
      warnings,
      status: getStatus(errors, warnings),
    }
  })
}

export async function ensureProduct(productCode = "", productName = "") {
  return prisma.product.upsert({
    where: { code: productCode },
    create: {
      code: productCode,
      name: productName,
    },
    update: {
      name: productName,
      deletedAt: null,
    },
  })
}

export function getImportMappings() {
  return MAPPINGS
}

export function getParsedAmount(row: ImportRow) {
  return toNumber(row.amount)
}

export function getParsedDate(row: ImportRow) {
  return parseDate(row.date)
}
