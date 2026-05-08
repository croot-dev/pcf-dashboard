export type ImportStatus = "valid" | "warning" | "error"

export type ImportRow = {
  id: string
  rowNumber: number
  date: string
  activityType: string
  sourceName: string
  amount: string
  unit: string
  productCode: string
  productName: string
  emissionFactorId: string | null
  factor: number | null
  co2e: number | null
  status: ImportStatus
  errors: string[]
  warnings: string[]
  raw: Record<string, unknown>
}

export type ImportSummary = {
  total: number
  valid: number
  warning: number
  error: number
  duplicate: number
}

export type ColumnMapping = {
  source: string
  target: string
}

export type OperEmissionFactor = {
  id: string
  activityType: string
  sourceName: string
  scope: 1 | 2 | 3
  unit: string
  factor: number
  validFrom: string
  validTo: string | null
}

export type ImportPreviewResponse = {
  fileName: string
  sheetName: string
  mappings: ColumnMapping[]
  sourceHeaders: string[]
  rows: ImportRow[]
  summary: ImportSummary
  factors: OperEmissionFactor[]
}

export type ImportCommitResponse = {
  saved: number
  updated: number
  skipped: number
  summary: ImportSummary
  rows: ImportRow[]
}
