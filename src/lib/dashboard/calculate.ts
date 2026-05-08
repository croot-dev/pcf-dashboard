import dayjs from "@/lib/dayjs"

import type {
  ActivityPoint,
  DashboardData,
  FactorRow,
  MonthlyPoint,
  PCFTableRow,
  RecordCounts,
  SourceRow,
  YoYPoint,
} from "@/lib/mock-data"

export type DashboardEmissionRow = {
  date: Date
  co2e: number
  amount: number
  activityUnit: string
  activityType: string
  sourceName: string
  scope: 1 | 2 | 3
  createdAt: Date
  productCode: string
  productName: string
  batchId?: string | null
  producedQuantity?: number | null
}

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

export function getPeriodWindow(year: number): PeriodWindow {
  const cur = dayjs.utc(`${year}-01-01`).startOf("year")
  const curEnd = cur.endOf("year")
  const prev = cur.subtract(1, "year")
  const prevEnd = prev.endOf("year")

  return {
    currentStart: cur.toDate(),
    currentEnd: curEnd.toDate(),
    previousStart: prev.toDate(),
    previousEnd: prevEnd.toDate(),
    trendStart: cur.toDate(),
    trendEnd: curEnd.toDate(),
  }
}

export function isValidPeriod(period: string | null): boolean {
  if (!period) return false
  const n = Number(period)
  return Number.isInteger(n) && n >= 2000 && n <= 2099
}

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
  if (["1", "2", "3"].includes(normalized)) return Number(normalized) as 1 | 2 | 3
  return 3
}

function sum(rows: DashboardEmissionRow[]) {
  return rows.reduce((total, row) => total + row.co2e, 0)
}

function percentDelta(current: number, previous: number) {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

function monthKey(date: Date) {
  return dayjs.utc(date).format("YYYY-MM")
}

function monthLabel(date: Date) {
  return dayjs.utc(date).format("MM")
}

function countBucket(row: DashboardEmissionRow): keyof RecordCounts {
  const t = row.activityType.toLowerCase()
  if (t.includes("전기") || t.includes("electric")) return "electricity"
  if (t.includes("운송") || t.includes("transport")) return "transport"
  return "rawMaterial"
}

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
    points.push({ m: key, co2: totals.get(key) ?? 0 })
    cursor = cursor.add(1, "month")
  }

  return points
}

export function buildActivityTrend(
  rows: DashboardEmissionRow[],
  window: PeriodWindow
): ActivityPoint[] {
  const points = new Map<string, ActivityPoint>()

  let cursor = dayjs.utc(window.trendStart).startOf("month")
  const end = dayjs.utc(window.trendEnd).startOf("month")

  while (cursor.isBefore(end) || cursor.isSame(end)) {
    points.set(cursor.format("MM"), { m: cursor.format("MM") })
    cursor = cursor.add(1, "month")
  }

  for (const row of rows) {
    const label = monthLabel(row.date)
    const point = points.get(label)
    if (!point) continue
    point[row.activityType] = ((point[row.activityType] as number | undefined) ?? 0) + row.co2e
  }

  return Array.from(points.values())
}

export function buildSources(rows: DashboardEmissionRow[]): SourceRow[] {
  const totals = new Map<string, SourceRow>()

  for (const row of rows) {
    const name = `${row.activityType} · ${row.sourceName}`
    const existing = totals.get(name)
    if (existing) {
      existing.value += row.co2e
    } else {
      totals.set(name, { name, value: row.co2e, scope: row.scope })
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.value - a.value)
}

type PCFAggEntry = {
  activityType: string
  sourceName: string
  scope: 1 | 2 | 3
  amount: number
  unit: string
  co2e: number
}

export function buildPCFTable(
  rows: DashboardEmissionRow[],
  totalQuantity: number,
  factors: FactorRow[]
): PCFTableRow[] {
  // 활동유형·배출원 조합으로 집계: 같은 배출원의 월별 데이터를 합산
  const agg = new Map<string, PCFAggEntry>()

  for (const row of rows) {
    const key = `${row.activityType}|${row.sourceName}`
    const existing = agg.get(key)
    if (existing) {
      existing.amount += row.amount
      existing.co2e += row.co2e
    } else {
      agg.set(key, {
        activityType: row.activityType,
        sourceName: row.sourceName,
        scope: row.scope,
        amount: row.amount,
        unit: row.activityUnit,
        co2e: row.co2e,
      })
    }
  }

  const factorMap = new Map(factors.map((f) => [`${f.activityType}|${f.sourceName}`, f]))

  return Array.from(agg.values())
    .map((entry) => {
      const f = factorMap.get(`${entry.activityType}|${entry.sourceName}`)
      return {
        activityType: entry.activityType,
        sourceName: entry.sourceName,
        scope: entry.scope,
        amount: entry.amount,
        unit: entry.unit,
        factor: f?.factor ?? 0,
        factorUnit: f?.unit ?? "",
        co2e: entry.co2e,
        // 배출원별 CO₂e를 동일한 생산 수량으로 나눔: PCF = 배출원 CO₂e 합계 / 총생산량
        // 이미 모든 배출원이 같은 제품 배치에서 발생
        co2ePerUnit: totalQuantity > 0 ? entry.co2e / totalQuantity : 0,
      }
    })
    .sort((a, b) => a.scope - b.scope || b.co2e - a.co2e)
}

export function buildRecordCounts(rows: DashboardEmissionRow[]): RecordCounts {
  const counts = { ...EMPTY_COUNTS }
  for (const row of rows) {
    counts[countBucket(row)] += 1
  }
  return counts
}

export function buildScope(rows: DashboardEmissionRow[]) {
  const scope = { s1: 0, s2: 0, s3: 0 }
  for (const row of rows) {
    if (row.scope === 1) scope.s1 += row.co2e
    else if (row.scope === 2) scope.s2 += row.co2e
    else scope.s3 += row.co2e
  }
  return scope
}

export function buildYoYActivity(
  currentRows: DashboardEmissionRow[],
  previousRows: DashboardEmissionRow[]
): YoYPoint[] {
  const thisYear = new Map<string, number>()
  const lastYear = new Map<string, number>()

  for (const row of currentRows) {
    const m = dayjs.utc(row.date).format("MM")
    thisYear.set(m, (thisYear.get(m) ?? 0) + row.co2e)
  }

  for (const row of previousRows) {
    const m = dayjs.utc(row.date).format("MM")
    lastYear.set(m, (lastYear.get(m) ?? 0) + row.co2e)
  }

  return Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0")
    return { m, thisYear: thisYear.get(m) ?? 0, lastYear: lastYear.get(m) ?? 0 }
  })
}

export function buildProducts(
  currentRows: DashboardEmissionRow[],
  previousRows: DashboardEmissionRow[]
) {
  const current = new Map<string, { code: string; name: string; co2e: number; quantity: number; batchIds: Set<string> }>()
  const previous = new Map<string, number>()

  for (const row of currentRows) {
    const existing = current.get(row.productCode) ?? {
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

    current.set(row.productCode, existing)
  }

  for (const row of previousRows) {
    previous.set(row.productCode, (previous.get(row.productCode) ?? 0) + row.co2e)
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

  const seenBatches = new Set<string>()
  let totalQuantity = 0
  for (const row of currentRows) {
    if (row.batchId && !seenBatches.has(row.batchId)) {
      seenBatches.add(row.batchId)
      totalQuantity += row.producedQuantity ?? 0
    }
  }

  const latestImport = currentRows.reduce<Date | null>(
    (latest, row) => (latest === null || row.createdAt > latest ? row.createdAt : latest),
    null
  )

  return {
    totalCO2,
    deltaCO2: percentDelta(totalCO2, previousTotalCO2),
    totalPCF: totalQuantity > 0 ? totalCO2 / totalQuantity : 0,
    totalQuantity,
    pcfTable: buildPCFTable(currentRows, totalQuantity, factors),
    lastImport: latestImport ? dayjs(latestImport).format("YYYY-MM-DD HH:mm") : "-",
    recordCount: currentRows.length,
    recordCounts,
    monthly: buildMonthlyTrend(trendRows, window),
    activity: buildActivityTrend(trendRows, window),
    yoyActivity: buildYoYActivity(currentRows, previousRows),
    products: buildProducts(currentRows, previousRows),
    sources: buildSources(currentRows),
    scope: buildScope(currentRows),
    factors,
  }
}
