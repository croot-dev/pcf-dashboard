"use client"

import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  type TooltipContentProps,
  type BarShapeProps,
} from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { MonthlyPoint } from "@/lib/dashboard/types"

function buildMoM(monthly: MonthlyPoint[]) {
  return monthly.slice(1).map((cur, i) => {
    const prev = monthly[i]
    const delta = cur.co2 - prev.co2
    return { m: cur.m.slice(5), delta, pct: (delta / prev.co2) * 100 }
  })
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const delta = Number(payload[0].value)
  const isDown = delta < 0
  return (
    <div
      style={{
        background: "var(--surface-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "8px 12px",
        fontSize: 12,
      }}
    >
      <div style={{ fontFamily: "var(--font-mono)", color: "var(--fg-3)", marginBottom: 4 }}>
        2025-{label}
      </div>
      <div style={{ color: isDown ? "var(--success-700)" : "var(--danger-700)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
        {delta > 0 ? "+" : ""}{delta.toLocaleString()} kg
      </div>
    </div>
  )
}

interface Props {
  monthly: MonthlyPoint[]
}

export function MoMVarianceChart({ monthly }: Props) {
  const data = buildMoM(monthly)

  return (
    <Card className="flex-1 gap-0 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-[13px] font-semibold">전월 대비 증감 현황</CardTitle>
        <CardDescription className="text-[11px]">지난달 대비 배출량의 순 증감량 (kgCO₂e)</CardDescription>
      </CardHeader>
      <CardContent className="p-5 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="35%">
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
              tickFormatter={(v: number) => `${v >= 0 ? "+" : ""}${v >= 1000 || v <= -1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              width={44}
            />
            <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />
            <Tooltip content={ChartTooltip} cursor={{ fill: "var(--bg-subtle)" }} />
            <Bar
              dataKey="delta"
              radius={[3, 3, 3, 3]}
              shape={(props: BarShapeProps) => (
                <Rectangle
                  {...props}
                  fill={(props.payload as { delta: number }).delta < 0 ? "var(--success-700)" : "var(--danger-700)"}
                  opacity={0.8}
                />
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
