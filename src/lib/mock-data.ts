export type PeriodId = "q1" | "q2" | "q3" | "q4" | "year"

export interface Period {
  id: PeriodId
  ko: string
  en: string
  range: string
}

export interface MonthlyPoint {
  m: string
  co2: number
}

export interface ActivityPoint {
  m: string
  electricity: number // kgCO₂e
  plastic1: number
  plastic2: number
  truck: number
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
  scope: 1 | 2 | 3
}

export interface RecordCounts {
  electricity: number
  rawMaterial: number
  transport: number
}

export interface FactorRow {
  activityType: string
  sourceName: string
  scope: 1 | 2 | 3
  unit: string
  factor: number
}

export interface DashboardData {
  totalCO2: number
  deltaCO2: number
  lastImport: string
  recordCount: number
  recordCounts: RecordCounts
  monthly: MonthlyPoint[]
  activity: ActivityPoint[]
  products: ProductRow[]
  sources: SourceRow[]
  scope: { s1: number; s2: number; s3: number }
  factors: FactorRow[]
}

