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
import type { ActivityPoint } from "@/lib/mock-data"

const SERIES = [
  { key: "plastic1",    label: "플라스틱 1", color: "#0ea5e9" },
  { key: "truck",       label: "트럭 운송",  color: "#10b981" },
  { key: "plastic2",    label: "플라스틱 2", color: "#06b6d4" },
  { key: "electricity", label: "전기",       color: "#8b5cf6" },
] as const

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, e) => s + (Number(e.value) || 0), 0)
  return (
    <div
      style={{
        background: "var(--surface-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        fontSize: 12,
        minWidth: 160,
      }}
    >
      <div style={{ fontFamily: "var(--font-mono)", color: "var(--fg-3)", marginBottom: 6 }}>
        2025-{label}
      </div>
      {[...payload].reverse().map((e) => (
        <div key={String(e.dataKey)} style={{ display: "flex", justifyContent: "space-between", gap: 16, color: e.color, marginBottom: 2 }}>
          <span>{SERIES.find((s) => s.key === e.dataKey)?.label ?? String(e.dataKey)}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
            {Number(e.value).toLocaleString()} kg
          </span>
        </div>
      ))}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          marginTop: 6,
          paddingTop: 6,
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 600,
          color: "var(--fg-1)",
        }}
      >
        <span>합계</span>
        <span style={{ fontFamily: "var(--font-mono)" }}>{total.toLocaleString()} kg</span>
      </div>
    </div>
  )
}

interface Props {
  data: ActivityPoint[]
}

export function StackedActivityChart({ data }: Props) {
  return (
    <Card className="flex-1 gap-0 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-[13px] font-semibold">활동 유형별 월별 배출</CardTitle>
        <CardDescription className="text-[11px]">전기 · 원소재 · 운송 스택 (kgCO₂e)</CardDescription>
        <CardAction>
          <div className="flex gap-3">
            {SERIES.map((s) => (
              <span key={s.key} className="flex items-center gap-1 text-[11px]" style={{ color: "var(--fg-3)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: "inline-block" }} />
                {s.label}
              </span>
            ))}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="p-5 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
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
              tickFormatter={(v: number) => `${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              width={36}
            />
            <Tooltip content={ChartTooltip} cursor={{ fill: "var(--bg-subtle)" }} />
            {SERIES.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="a"
                fill={s.color}
                radius={s.key === "electricity" ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
