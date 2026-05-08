"use client"

import { useState } from "react"
import {
  PieChart,
  Pie,
  Sector,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
  type PieSectorShapeProps,
} from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { SourceRow } from "@/lib/mock-data"

const COLORS = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"]

function DonutTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const e = payload[0]
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
      <div style={{ fontWeight: 500 }}>{e.name}</div>
      <div style={{ fontFamily: "var(--font-mono)", marginTop: 2 }}>
        {e.value?.toLocaleString()} kg CO₂e
      </div>
    </div>
  )
}

interface Props {
  sources: SourceRow[]
}

export function SourceBreakdownDonut({ sources }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const total = sources.reduce((s, r) => s + r.value, 0)
  const sorted = [...sources].sort((a, b) => b.value - a.value)

  return (
    <Card className="flex-1 gap-0 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-[13px] font-semibold">배출원 비중</CardTitle>
        <CardDescription className="text-[11px]">활동 설명별 CO₂e 기여도</CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie
                  data={sorted}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={62}
                  strokeWidth={0}
                  onMouseEnter={(_, i) => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  shape={(props: PieSectorShapeProps, index: number) => (
                    <Sector
                      {...props}
                      fill={COLORS[index % COLORS.length]}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                    />
                  )}
                >
                </Pie>
                <Tooltip content={DonutTooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {activeIndex !== null ? (
                <>
                  <span style={{ fontSize: 9, color: COLORS[activeIndex], fontWeight: 600 }}>
                    {((sorted[activeIndex].value / total) * 100).toFixed(0)}%
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, marginTop: 1 }}>
                    {(sorted[activeIndex].value / 1000).toFixed(2)}t
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: ".06em" }}>TOTAL</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, marginTop: 1 }}>
                    {(total / 1000).toFixed(2)}t
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1.5">
            {sorted.map((s, i) => (
              <div
                key={s.name}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                className="flex items-center gap-2 px-1.5 py-1 cursor-default transition-colors"
                style={{
                  borderRadius: "var(--radius-sm)",
                  background: activeIndex === i ? "var(--bg-subtle)" : "transparent",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: COLORS[i % COLORS.length],
                    flexShrink: 0,
                  }}
                />
                <span className="flex-1 text-[11px] truncate">{s.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-2)", flexShrink: 0 }}>
                  {((s.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
