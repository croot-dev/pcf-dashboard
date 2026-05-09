
export const SCOPES = [1, 2, 3] as const

export type Scope = (typeof SCOPES)[number]

export const SCOPE_LABEL: Record<Scope, string> = {
  1: "Scope 1",
  2: "Scope 2",
  3: "Scope 3",
}

export const SCOPE_COLOR: Record<Scope, string> = {
  1: "#ef4444",
  2: "#0ea5e9",
  3: "#8b5cf6",
}

export const SCOPE_PALETTES: Record<Scope, string[]> = {
  1: ["#ef4444", "#f87171", "#fca5a5", "#fecaca"],
  2: ["#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd"],
  3: ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"],
}

export const SCOPE_LABEL_TO_COLOR: Record<string, string> = {
  [SCOPE_LABEL[1]]: SCOPE_COLOR[1],
  [SCOPE_LABEL[2]]: SCOPE_COLOR[2],
  [SCOPE_LABEL[3]]: SCOPE_COLOR[3],
}

export interface MonthlyPoint {
  m: string
  co2: number
}

export interface ActivityPoint {
  m: string
  [activityType: string]: number | string
}

export interface ProductRow {
  code: string
  name: string
  unit: number
  delta: number
}

export interface SourceRow {
  name: string
  value: number
  scope: Scope
}

export interface PCFTableRow {
  activityType: string
  sourceName: string
  scope: Scope
  amount: number
  unit: string
  factor: number
  factorUnit: string
  co2e: number
  co2ePerUnit: number
}

export interface RecordCounts {
  electricity: number
  rawMaterial: number
  transport: number
}

export interface FactorRow {
  activityType: string
  sourceName: string
  scope: Scope
  unit: string
  factor: number
}

export interface YoYPoint {
  m: string        // "01" .. "12"
  thisYear: number // kgCO₂e
  lastYear: number // kgCO₂e
}

export interface DashboardData {
  totalCO2: number
  deltaCO2: number
  totalPCF: number
  totalQuantity: number
  pcfTable: PCFTableRow[]
  lastImport: string
  recordCount: number
  recordCounts: RecordCounts
  monthly: MonthlyPoint[]
  activity: ActivityPoint[]
  yoyActivity: YoYPoint[]
  products: ProductRow[]
  sources: SourceRow[]
  scope: { s1: number; s2: number; s3: number }
  factors: FactorRow[]
}
