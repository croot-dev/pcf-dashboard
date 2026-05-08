"use client"

import {
  ComposedChart,
  Bar,
  Line,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
  type BarShapeProps,
} from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { SourceRow } from "@/lib/mock-data"

const SCOPE_COLOR: Record<number, string> = { 1: "#0ea5e9", 2: "#8b5cf6", 3: "#10b981" }

function buildPareto(sources: SourceRow[]) {
  const sorted = [...sources].sort((a, b) => b.value - a.value)
  const total = sorted.reduce((s, r) => s + r.value, 0)
  let cum = 0
  return sorted.map((s) => {
    cum += s.value
    return {
      name: s.name.split("·")[1]?.trim() ?? s.name,
      fullName: s.name,
      value: s.value,
      scope: s.scope,
      cumPct: Math.round((cum / total) * 100),
    }
  })
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const bar = payload.find((p) => p.dataKey === "value")
  const line = payload.find((p) => p.dataKey === "cumPct")
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
      <div style={{ fontWeight: 500, marginBottom: 4 }}>{(bar?.payload as { fullName: string })?.fullName}</div>
      {bar && (
        <div style={{ fontFamily: "var(--font-mono)", color: bar.color }}>
          {Number(bar.value).toLocaleString()} kg CO₂e
        </div>
      )}
      {line && (
        <div style={{ fontFamily: "var(--font-mono)", color: "#f59e0b", fontSize: 11 }}>
          누적 {line.value}%
        </div>
      )}
    </div>
  )
}

interface Props {
  sources: SourceRow[]
}

export function ParetoChart({ sources }: Props) {
  const data = buildPareto(sources)

  return (
    <Card className="flex-1 gap-0 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-[13px] font-semibold">배출 기여도 순위</CardTitle>
        <CardDescription className="text-[11px]">Pareto — 누적 80% 라인</CardDescription>
      </CardHeader>
      <CardContent className="p-5 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 4, right: 40, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--fg-3)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="val"
              tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--fg-3)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              width={36}
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--fg-3)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
              width={32}
            />
            <Tooltip content={ChartTooltip} cursor={{ fill: "var(--bg-subtle)" }} />
            <Bar
              yAxisId="val"
              dataKey="value"
              radius={[4, 4, 0, 0]}
              shape={(props: BarShapeProps) => (
                <Rectangle
                  {...props}
                  fill={SCOPE_COLOR[(props.payload as { scope: number }).scope]}
                  opacity={1 - props.index * 0.12}
                />
              )}
            />
            <Line
              yAxisId="pct"
              type="monotone"
              dataKey="cumPct"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: "#f59e0b", r: 3 }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
