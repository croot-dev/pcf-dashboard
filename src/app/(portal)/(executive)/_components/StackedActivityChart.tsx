"use client"

import { useMemo } from "react"
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
import { Info } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from "@/components/ui/card"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SCOPE_LABEL_TO_COLOR, type ActivityPoint } from "@/lib/dashboard/types"

const COLORS = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"]

function deriveSeries(data: ActivityPoint[]) {
  const keys = new Set<string>()
  for (const point of data) {
    for (const k of Object.keys(point)) {
      if (k !== "m") keys.add(k)
    }
  }
  return Array.from(keys).map((key, i) => ({
    key,
    label: key,
    color: SCOPE_LABEL_TO_COLOR[key] ?? COLORS[i % COLORS.length],
  }))
}

type Series = ReturnType<typeof deriveSeries>

type TooltipProps = TooltipContentProps & { series: Series }

function ChartTooltip({ active, payload, label, series }: TooltipProps) {
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
        {label}월
      </div>
      {[...payload].reverse().map((e) => (
        <div key={String(e.dataKey)} style={{ display: "flex", justifyContent: "space-between", gap: 16, color: e.color, marginBottom: 2 }}>
          <span>{series.find((s) => s.key === e.dataKey)?.label ?? String(e.dataKey)}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
            {Number(e.value).toLocaleString()} kgCO₂e
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
        <span style={{ fontFamily: "var(--font-mono)" }}>{total.toLocaleString()} kgCO₂e</span>
      </div>
    </div>
  )
}

interface Props {
  data: ActivityPoint[]
}

export function StackedActivityChart({ data }: Props) {
  const series = useMemo(() => deriveSeries(data), [data])

  return (
    <Card className="flex-1 gap-0 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="flex items-center gap-1.5 text-[13px] font-semibold">
          월별 배출량
          <UITooltip>
            <TooltipTrigger asChild>
              <Info size={13} style={{ color: "var(--fg-3)", cursor: "help", flexShrink: 0 }} />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-62 space-y-1.5 p-3 text-[11px] leading-relaxed">
              <div><span className="font-semibold" style={{ color: SCOPE_LABEL_TO_COLOR["Scope 1"] }}>Scope 1</span> — 사업장 연료 연소·공정 등 직접 배출</div>
              <div><span className="font-semibold" style={{ color: SCOPE_LABEL_TO_COLOR["Scope 2"] }}>Scope 2</span> — 구매 전력·열 사용으로 인한 간접 배출</div>
              <div><span className="font-semibold" style={{ color: SCOPE_LABEL_TO_COLOR["Scope 3"] }}>Scope 3</span> — 원소재·운송 등 가치사슬 간접 배출</div>
            </TooltipContent>
          </UITooltip>
        </CardTitle>
        <CardDescription className="text-[11px]">Scope 별 월별 배출 추이 (kgCO₂e)</CardDescription>
        <CardAction>
          <div className="flex gap-3">
            {series.map((s) => (
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
            <Tooltip
              content={(props) => <ChartTooltip {...props} series={series} />}
              cursor={{ fill: "var(--bg-subtle)" }}
            />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="a"
                fill={s.color}
                radius={i === series.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
