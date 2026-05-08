export type PeriodId = "month" | "quarter" | "year"

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
}

// 배출계수 (사용자 입력 / DB 관리 예정 — 현재는 기본값)
export const EMISSION_FACTORS = {
  electricity: 0.456, // kgCO₂e / kWh  (한국전력 기본값)
  plastic1:    2.3,   // kgCO₂e / kg
  plastic2:    3.2,   // kgCO₂e / kg
  truck:       3.5,   // kgCO₂e / ton-km
} as const

export const ACTIVITY_SCOPE: Record<keyof typeof EMISSION_FACTORS, 1 | 2 | 3> = {
  electricity: 2,
  plastic1:    3,
  plastic2:    3,
  truck:       3,
}

export const PERIODS: Period[] = [
  { id: "month",   ko: "월간", en: "Monthly",   range: "2025-08" },
  { id: "quarter", ko: "분기", en: "Quarterly", range: "2025 Q2" },
  { id: "year",    ko: "연간", en: "Annual",    range: "2025 YTD" },
]

// 월별 kgCO₂e 합산 (활동량 × 배출계수)
// 전기: ×0.456 / 플라스틱1: ×2.3 / 플라스틱2: ×3.2 / 트럭: ×3.5
const MONTHLY_TREND: MonthlyPoint[] = [
  { m: "2025-01", co2:  722.66   }, // 50.16 + 529 + 0 + 143.5
  { m: "2025-02", co2: 1571.572  }, // 51.072 + 782 + 0 + 738.5
  { m: "2025-03", co2: 1545.54   }, // 52.44 + 989 + 73.6 + 430.5
  { m: "2025-04", co2: 1379.28   }, // 59.28 + 1173 + 0 + 147
  { m: "2025-05", co2: 2210.076  }, // 100.776 + 1508.8 + 128 + 472.5
  { m: "2025-06", co2: 1515.66   }, // 50.16 + 1035 + 0 + 430.5
  { m: "2025-07", co2: 1117.82   }, // 54.72 + 782 + 137.6 + 143.5
  { m: "2025-08", co2: 1010.116  }, // 50.616 + 529 + 0 + 430.5
]

// 활동 유형별 배출 분해 (kgCO₂e, 스택드 차트용)
const ACTIVITY_TREND: ActivityPoint[] = [
  { m: "01", electricity:  50.16,  plastic1:  529,   plastic2:   0,   truck: 143.5 },
  { m: "02", electricity:  51.072, plastic1:  782,   plastic2:   0,   truck: 738.5 },
  { m: "03", electricity:  52.44,  plastic1:  989,   plastic2:  73.6, truck: 430.5 },
  { m: "04", electricity:  59.28,  plastic1: 1173,   plastic2:   0,   truck: 147   },
  { m: "05", electricity: 100.776, plastic1: 1508.8, plastic2: 128,   truck: 472.5 },
  { m: "06", electricity:  50.16,  plastic1: 1035,   plastic2:   0,   truck: 430.5 },
  { m: "07", electricity:  54.72,  plastic1:  782,   plastic2: 137.6, truck: 143.5 },
  { m: "08", electricity:  50.616, plastic1:  529,   plastic2:   0,   truck: 430.5 },
]

const PLACEHOLDER_PRODUCTS: ProductRow[] = [
  { code: "N/A", name: "제품 데이터 미연동", unit: 0, delta: 0 },
]

export const MOCK_DATA: Record<PeriodId, DashboardData> = {
  // ── 2025-08 (최근 1개월) ─────────────────────────────────────────
  month: {
    totalCO2: 1010.116,
    deltaCO2: -9.6,                    // (1010.116 − 1117.82) / 1117.82 × 100
    lastImport: "2025-08-01 00:00",    // 데이터상 마지막 활동 일자 기준
    recordCount: 3,
    recordCounts: { electricity: 1, rawMaterial: 1, transport: 1 },
    monthly: MONTHLY_TREND,
    activity: ACTIVITY_TREND,
    products: PLACEHOLDER_PRODUCTS,
    sources: [
      { name: "원소재 · 플라스틱 1", value:  529,    scope: 3 },
      { name: "운송 · 트럭",         value:  430.5,  scope: 3 },
      { name: "전기 · 한국전력",     value:   50.616, scope: 2 },
    ],
    scope: { s1: 0, s2: 50.616, s3: 959.5 },
  },

  // ── 2025 Q2 (4~6월) ──────────────────────────────────────────────
  quarter: {
    totalCO2: 5105.016,                // 1379.28 + 2210.076 + 1515.66
    deltaCO2: 32.9,                    // vs Q1 3839.772
    lastImport: "2025-06-01 00:00",
    recordCount: 13,
    recordCounts: { electricity: 4, rawMaterial: 5, transport: 4 },
    monthly: MONTHLY_TREND,
    activity: ACTIVITY_TREND,
    products: PLACEHOLDER_PRODUCTS,
    sources: [
      { name: "원소재 · 플라스틱 1", value: 3716.8,  scope: 3 },
      { name: "운송 · 트럭",         value: 1050,    scope: 3 },
      { name: "원소재 · 플라스틱 2", value:  128,    scope: 3 },
      { name: "전기 · 한국전력",     value:  210.216, scope: 2 },
    ],
    scope: { s1: 0, s2: 210.216, s3: 4894.8 },
  },

  // ── 2025 YTD (1~8월 누적) ────────────────────────────────────────
  year: {
    totalCO2: 11072.724,
    deltaCO2: 0,                       // 전년(2024) 데이터 없음 — 산출 불가
    lastImport: "2025-08-01 00:00",
    recordCount: 30,
    recordCounts: { electricity: 9, rawMaterial: 12, transport: 9 },
    monthly: MONTHLY_TREND,
    activity: ACTIVITY_TREND,
    products: PLACEHOLDER_PRODUCTS,
    sources: [
      { name: "원소재 · 플라스틱 1", value: 7327.8,  scope: 3 },
      { name: "운송 · 트럭",         value: 2936.5,  scope: 3 },
      { name: "원소재 · 플라스틱 2", value:  339.2,  scope: 3 },
      { name: "전기 · 한국전력",     value:  469.224, scope: 2 },
    ],
    scope: { s1: 0, s2: 469.224, s3: 10603.5 },
  },
}
