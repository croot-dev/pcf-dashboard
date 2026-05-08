import dayjs from "@/lib/dayjs"

import type {
  ActivityPoint,
  DashboardData,
  FactorRow,
  MonthlyPoint,
  PeriodId,
  RecordCounts,
  SourceRow,
} from "@/lib/mock-data"

export type DashboardEmissionRow = {
  date: Date
  co2e: number
  activityType: string
  sourceName: string
  scope: 1 | 2 | 3
  createdAt: Date
  productCode: string
  productName: string
  batchId?: string | null
  producedQuantity?: number | null
}

export type ActiveEmissionFactorRow = {
  activityType: string
  sourceName: string
  scope: 1 | 2 | 3
  unit: string
  factor: number
}

type ActivityEmissionKey = Exclude<keyof ActivityPoint, "m">

export type PeriodWindow = {
  currentStart: Date
  currentEnd: Date
  previousStart: Date
  previousEnd: Date
  trendStart: Date
  trendEnd: Date
}

const EMPTY_COUNTS: RecordCounts = {
  electricity: 0,
  rawMaterial: 0,
  transport: 0,
}

const QUARTER_START_MONTH: Record<"q1" | "q2" | "q3" | "q4", number> = {
  q1: 0,
  q2: 3,
  q3: 6,
  q4: 9,
}

const QUARTER_PREV: Record<
  "q1" | "q2" | "q3" | "q4",
  { q: "q1" | "q2" | "q3" | "q4"; yearOffset: number }
> = {
  q1: { q: "q4", yearOffset: -1 },
  q2: { q: "q1", yearOffset: 0 },
  q3: { q: "q2", yearOffset: 0 },
  q4: { q: "q3", yearOffset: 0 },
}

/**
 * 선택된 기간(q1~q4, year)의 현재/이전 기간 범위를 계산
 */
export function getPeriodWindow(period: PeriodId, anchor: Date): PeriodWindow {
  const base = dayjs.utc(anchor)

  if (period !== "year") {
    const year = base.year()
    const startMonth = QUARTER_START_MONTH[period]

    const currentStart = dayjs.utc()
      .year(year)
      .month(startMonth)
      .startOf("month")

    const currentEnd = currentStart.endOf("quarter")

    const prev = QUARTER_PREV[period]
    const prevStart = dayjs.utc()
      .year(year + prev.yearOffset)
      .month(QUARTER_START_MONTH[prev.q])
      .startOf("month")

    const previousEnd = prevStart.endOf("quarter")

    return {
      currentStart: currentStart.toDate(),
      currentEnd: currentEnd.toDate(),
      previousStart: prevStart.toDate(),
      previousEnd: previousEnd.toDate(),
      trendStart: currentStart.toDate(),
      trendEnd: currentEnd.toDate(),
    }
  }

  const currentStart = base.startOf("year")
  const yearEnd = base.endOf("year")

  return {
    currentStart: currentStart.toDate(),
    currentEnd: (base.isBefore(yearEnd) ? base : yearEnd).toDate(),
    previousStart: base.subtract(1, "year").startOf("year").toDate(),
    previousEnd: base.subtract(1, "year").toDate(),
    trendStart: currentStart.toDate(),
    trendEnd: (base.isBefore(yearEnd) ? base : yearEnd).toDate(),
  }
}

/**
 * 유효한 기간 검사
 */
export function isValidPeriod(period: string | null): period is PeriodId {
  return ["q1", "q2", "q3", "q4", "year"].includes(period ?? "")
}

/**
 * 기간 창을 기반으로 포함되는 날짜 필터를 생성
 */
export function toInclusiveDateFilter(
  window: Pick<PeriodWindow, "currentStart" | "currentEnd">
) {
  return {
    gte: window.currentStart,
    lte: window.currentEnd,
  }
}

export function toScope(value: string | number): 1 | 2 | 3 {
  const normalized = String(value).replace(/scope/i, "").trim()

  if (["1", "2", "3"].includes(normalized)) {
    return Number(normalized) as 1 | 2 | 3
  }

  return 3
}

/**
 * 배열의 총합 계산
 */
function sum(rows: DashboardEmissionRow[]) {
  return rows.reduce((total, row) => total + row.co2e, 0)
}

/**
 * 백분율 변화 계산
 */
function percentDelta(current: number, previous: number) {
  if (previous === 0) return 100
  return ((current - previous) / previous) * 100
}


function monthKey(date: Date) {
  return dayjs.utc(date).format("YYYY-MM")
}

function monthLabel(date: Date) {
  return dayjs.utc(date).format("MM")
}

/**
 * 활동 유형에 따라 버킷을 결정
 */
function getActivityBucket(row: DashboardEmissionRow): ActivityEmissionKey {
  const activityType = row.activityType.toLowerCase()
  const sourceName = row.sourceName.toLowerCase()

  if (activityType.includes("전기") || activityType.includes("electric")) {
    return "electricity"
  }

  if (activityType.includes("운송") || activityType.includes("transport")) {
    return "truck"
  }

  if (
    sourceName.includes("2") ||
    sourceName.includes("철강") ||
    sourceName.includes("steel")
  ) {
    return "plastic2"
  }

  return "plastic1"
}

/**
 * 활동 유형에 따라 카운트 버킷을 결정
 */
function countBucket(row: DashboardEmissionRow): keyof RecordCounts {
  const activityType = row.activityType.toLowerCase()

  if (activityType.includes("전기") || activityType.includes("electric")) {
    return "electricity"
  }

  if (activityType.includes("운송") || activityType.includes("transport")) {
    return "transport"
  }

  return "rawMaterial"
}

/**
 * 월별 추세 데이터 파싱
 */
export function buildMonthlyTrend(
  rows: DashboardEmissionRow[],
  window: PeriodWindow
): MonthlyPoint[] {
  const totals = new Map<string, number>()

  for (const row of rows) {
    const key = monthKey(row.date)
    totals.set(key, (totals.get(key) ?? 0) + row.co2e)
  }

  const points: MonthlyPoint[] = []

  let cursor = dayjs.utc(window.trendStart).startOf("month")
  const end = dayjs.utc(window.trendEnd).startOf("month")

  while (cursor.isBefore(end) || cursor.isSame(end)) {
    const key = cursor.format("YYYY-MM")

    points.push({
      m: key,
      co2: totals.get(key) ?? 0,
    })

    cursor = cursor.add(1, "month")
  }

  return points
}

export function buildActivityTrend(
  rows: DashboardEmissionRow[],
  window: PeriodWindow
): ActivityPoint[] {
  const totals = new Map<string, ActivityPoint>()

  let cursor = dayjs.utc(window.trendStart).startOf("month")
  const end = dayjs.utc(window.trendEnd).startOf("month")

  while (cursor.isBefore(end) || cursor.isSame(end)) {
    const label = cursor.format("MM")

    totals.set(label, {
      m: label,
      electricity: 0,
      plastic1: 0,
      plastic2: 0,
      truck: 0,
    })

    cursor = cursor.add(1, "month")
  }

  for (const row of rows) {
    const label = monthLabel(row.date)
    const point = totals.get(label)

    if (!point) continue

    point[getActivityBucket(row)] += row.co2e
  }

  return Array.from(totals.values())
}

export function buildSources(rows: DashboardEmissionRow[]): SourceRow[] {
  const totals = new Map<string, SourceRow>()

  for (const row of rows) {
    const name = `${row.activityType} · ${row.sourceName}`

    const existing = totals.get(name)

    if (existing) {
      existing.value += row.co2e
    } else {
      totals.set(name, {
        name,
        value: row.co2e,
        scope: row.scope,
      })
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.value - a.value)
}

export function buildRecordCounts(
  rows: DashboardEmissionRow[]
): RecordCounts {
  const counts = { ...EMPTY_COUNTS }

  for (const row of rows) {
    counts[countBucket(row)] += 1
  }

  return counts
}

export function buildScope(rows: DashboardEmissionRow[]) {
  return rows.reduce(
    (scope, row) => {
      if (row.scope === 1) scope.s1 += row.co2e
      if (row.scope === 2) scope.s2 += row.co2e
      if (row.scope === 3) scope.s3 += row.co2e

      return scope
    },
    { s1: 0, s2: 0, s3: 0 }
  )
}

export function buildProducts(
  currentRows: DashboardEmissionRow[],
  previousRows: DashboardEmissionRow[]
) {
  const current = new Map<
    string,
    {
      code: string
      name: string
      co2e: number
      quantity: number
      batchIds: Set<string>
    }
  >()

  const previous = new Map<string, number>()

  for (const row of currentRows) {
    const key = row.productCode

    const existing = current.get(key) ?? {
      code: row.productCode,
      name: row.productName,
      co2e: 0,
      quantity: 0,
      batchIds: new Set<string>(),
    }

    existing.co2e += row.co2e

    if (row.batchId && !existing.batchIds.has(row.batchId)) {
      existing.batchIds.add(row.batchId)
      existing.quantity += row.producedQuantity ?? 0
    }

    current.set(key, existing)
  }

  for (const row of previousRows) {
    previous.set(
      row.productCode,
      (previous.get(row.productCode) ?? 0) + row.co2e
    )
  }

  const products = Array.from(current.values()).map((row) => ({
    code: row.code,
    name: row.name,
    unit: row.quantity > 0 ? row.co2e / row.quantity : row.co2e,
    delta: percentDelta(row.co2e, previous.get(row.code) ?? 0),
  }))

  return products.length > 0
    ? products.sort((a, b) => b.unit - a.unit)
    : [{ code: "N/A", name: "제품 데이터 없음", unit: 0, delta: 0 }]
}

/**
 * 경영진 대시보드용 통합 데이터 생성
 */
export function buildExecutiveDashboardData({
  currentRows,
  previousRows,
  trendRows,
  window,
  factors,
}: {
  currentRows: DashboardEmissionRow[]
  previousRows: DashboardEmissionRow[]
  trendRows: DashboardEmissionRow[]
  window: PeriodWindow
  factors: FactorRow[]
}): DashboardData {
  const totalCO2 = sum(currentRows)
  const previousTotalCO2 = sum(previousRows)
  const recordCounts = buildRecordCounts(currentRows)

  return {
    totalCO2,
    deltaCO2: percentDelta(totalCO2, previousTotalCO2),

    lastImport:
      currentRows
        .map((row) => row.createdAt)
        .sort((a, b) => b.getTime() - a.getTime())[0]
        ? dayjs(
            currentRows
              .map((row) => row.createdAt)
              .sort((a, b) => b.getTime() - a.getTime())[0]
          ).format("YYYY-MM-DD HH:mm")
        : "-",

    recordCount: currentRows.length,
    recordCounts,

    monthly: buildMonthlyTrend(trendRows, window),
    activity: buildActivityTrend(trendRows, window),
    products: buildProducts(currentRows, previousRows),
    sources: buildSources(currentRows),
    scope: buildScope(currentRows),
    factors,
  }
}