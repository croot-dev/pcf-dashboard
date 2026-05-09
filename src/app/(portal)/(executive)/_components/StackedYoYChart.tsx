"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
} from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from "@/components/ui/card"
import type { YoYPoint } from "@/lib/dashboard/types"

const THIS_YEAR_COLOR = "#0ea5e9"
const LAST_YEAR_COLOR = "#E5E7EB"
const LAST_YEAR_TEXT  = "#9CA3AF"

function fmt(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v))
}

type TooltipProps = TooltipContentProps & { year: number }

function YoYTooltip({ active, payload, label, year }: TooltipProps) {
  if (!active || !payload?.length) return null

  const thisYearVal = Number(payload.find((p) => p.dataKey === "thisYear")?.value ?? 0)
  const lastYearVal = Number(payload.find((p) => p.dataKey === "lastYear")?.value ?? 0)

  const pct = lastYearVal > 0 ? ((thisYearVal - lastYearVal) / lastYearVal) * 100 : null
  const deltaLabel = pct !== null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%` : null
  const isIncrease = pct !== null && pct >= 0

  return (
    <div
      style={{
        background: "var(--surface-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        fontSize: 12,
        minWidth: 176,
      }}
    >
      <div style={{ fontFamily: "var(--font-mono)", color: "var(--fg-3)", marginBottom: 8 }}>
        {label}월
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
        <span style={{ color: LAST_YEAR_TEXT }}>{year - 1}년</span>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--fg-2)" }}>
          {lastYearVal.toLocaleString()} kgCO₂e
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <span style={{ color: THIS_YEAR_COLOR, fontWeight: 600 }}>{year}년</span>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--fg-1)" }}>
          {thisYearVal.toLocaleString()} kgCO₂e
        </span>
      </div>

      {deltaLabel && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            marginTop: 8,
            paddingTop: 8,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
          }}
        >
          <span style={{ color: "var(--fg-3)" }}>전년 대비</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color: isIncrease ? "#ef4444" : "#10b981",
            }}
          >
            {deltaLabel}
          </span>
        </div>
      )}

      {lastYearVal === 0 && thisYearVal === 0 && (
        <div style={{ color: "var(--fg-3)", fontSize: 11, marginTop: 4 }}>데이터 없음</div>
      )}
    </div>
  )
}

interface Props {
  data: YoYPoint[]
  year: number
}

export function StackedYoYChart({ data, year }: Props) {
  return (
    <Card className="flex-1 gap-0 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-[13px] font-semibold">전년 대비 월별 배출량</CardTitle>
        <CardDescription className="text-[11px]">YoY 비교 (kgCO₂e)</CardDescription>
        <CardAction>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--fg-3)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: LAST_YEAR_COLOR, border: "1px solid #D1D5DB", display: "inline-block" }} />
              {year - 1}년
            </span>
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--fg-2)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: THIS_YEAR_COLOR, display: "inline-block" }} />
              {year}년
            </span>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="p-5 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            barCategoryGap="28%"
            barGap={3}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="m"
              tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--fg-3)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--fg-3)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmt}
              width={36}
            />
            <Tooltip
              content={(props) => <YoYTooltip {...props} year={year} />}
              cursor={{ fill: "var(--bg-subtle)" }}
            />
            <Bar dataKey="lastYear" name={`${year - 1}년`} fill={LAST_YEAR_COLOR} radius={[2, 2, 0, 0]} />
            <Bar dataKey="thisYear" name={`${year}년`}     fill={THIS_YEAR_COLOR} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
