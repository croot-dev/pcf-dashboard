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
import {
  SCOPES,
  SCOPE_COLOR,
  SCOPE_LABEL,
  SCOPE_LABEL_TO_COLOR,
  SCOPE_PALETTES,
  type Scope,
  type SourceRow,
} from "@/lib/dashboard/types"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"

type InnerEntry = { scope: Scope; name: string; value: number; fill: string; isInner: true }
type OuterEntry = { name: string; value: number; scope: Scope; fill: string; isInner: false }

function NestedTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const data = entry.payload as InnerEntry | OuterEntry
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
      <div style={{ fontWeight: 500, color: data.fill }}>{entry.name}</div>
      <div style={{ fontFamily: "var(--font-mono)", marginTop: 2 }}>
        {Number(entry.value).toLocaleString()} kgCO₂e
      </div>
      {!data.isInner && (
        <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 2 }}>
          {SCOPE_LABEL[data.scope]}
        </div>
      )}
    </div>
  )
}

interface Props {
  sources: SourceRow[]
}

export function SourceBreakdownDonut({ sources }: Props) {
  const [activeInner, setActiveInner] = useState<number | null>(null)
  const [activeOuter, setActiveOuter] = useState<number | null>(null)

  const total = sources.reduce((s, r) => s + r.value, 0)

  const scopeTotals = sources.reduce(
    (acc, s) => { acc[s.scope] += s.value; return acc },
    { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>
  )

  const innerData: InnerEntry[] = SCOPES
    .map((sc) => ({ scope: sc, name: SCOPE_LABEL[sc], value: scopeTotals[sc], fill: SCOPE_COLOR[sc], isInner: true as const }))

  const outerData: OuterEntry[] = SCOPES.flatMap((sc) =>
    [...sources]
      .filter((s) => s.scope === sc)
      .sort((a, b) => b.value - a.value)
      .map((s, i) => ({
        name: s.name,
        value: s.value,
        scope: sc,
        fill: SCOPE_PALETTES[sc][i % SCOPE_PALETTES[sc].length],
        isInner: false as const,
      }))
  )

  const hasActiveSlice = activeOuter !== null || activeInner !== null

  const centerValue =
    activeOuter !== null ? outerData[activeOuter].value
    : activeInner !== null ? innerData[activeInner].value
    : null

  const centerLabel =
    activeOuter !== null ? outerData[activeOuter].name.split(" · ")[0]
    : activeInner !== null ? innerData[activeInner].name
    : null

  const centerColor =
    activeOuter !== null ? outerData[activeOuter].fill
    : activeInner !== null ? innerData[activeInner].fill
    : "var(--fg-3)"

  return (
    <Card className="flex-1 gap-0 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="flex items-center gap-1.5 text-[13px] font-semibold">
          Scope 별 배출원 비중
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
        <CardDescription className="text-[11px]">Scope 안에서 어떤 배출원이 큰지 비교 (kgCO₂e)</CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Double ring */}
          <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                {/* Inner ring — Scope */}
                <Pie
                  data={innerData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={62}
                  strokeWidth={0}
                  onMouseEnter={(_, i) => { setActiveInner(i); setActiveOuter(null) }}
                  onMouseLeave={() => setActiveInner(null)}
                  shape={(props: PieSectorShapeProps, index: number) => {
                    const lit =
                      activeInner === null && activeOuter === null ? true
                      : activeInner === index ? true
                      : activeOuter !== null && outerData[activeOuter].scope === innerData[index].scope
                    return <Sector {...props} fill={innerData[index].fill} opacity={lit ? 1 : 0.2} />
                  }}
                />
                {/* Outer ring — Sources */}
                <Pie
                  data={outerData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={67}
                  outerRadius={74}
                  strokeWidth={1.5}
                  stroke="var(--bg-canvas, #fff)"
                  onMouseEnter={(_, i) => { setActiveOuter(i); setActiveInner(null) }}
                  onMouseLeave={() => setActiveOuter(null)}
                  shape={(props: PieSectorShapeProps, index: number) => {
                    const lit =
                      activeInner === null && activeOuter === null ? true
                      : activeOuter === index ? true
                      : activeInner !== null && outerData[index].scope === innerData[activeInner].scope
                    return <Sector {...props} fill={outerData[index].fill} opacity={lit ? 1 : 0.15} />
                  }}
                />
                <Tooltip content={NestedTooltip} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {hasActiveSlice && centerLabel && centerValue !== null && (
                <>
                  <span style={{ fontSize: 8, color: centerColor, letterSpacing: ".06em", fontWeight: 600, textTransform: "uppercase" }}>
                    {centerLabel}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, marginTop: 1 }}>
                    {(centerValue / 1000).toFixed(2)}t
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Hierarchical legend */}
          <div className="flex-1 flex flex-col gap-2.5 min-w-0">
            {innerData.map((scope, si) => (
              <div key={scope.scope}>
                <div
                  className="flex items-center gap-1.5 cursor-default mb-1"
                  onMouseEnter={() => { setActiveInner(si); setActiveOuter(null) }}
                  onMouseLeave={() => setActiveInner(null)}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: scope.fill, flexShrink: 0, display: "inline-block" }} />
                  <span className="text-[11px] font-semibold">{scope.name}</span>
                  <span className="ml-auto" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-3)" }}>
                    {total > 0 ? ((scope.value / total) * 100).toFixed(1) : "0"}%
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 ml-3.5">
                  {(() => {
                    const scopeSources = outerData.filter((s) => s.scope === scope.scope)
                    if (scopeSources.length === 0) {
                      return (
                        <div className="px-1 py-0.5 text-[10px]" style={{ color: "var(--fg-3)" }}>
                          데이터 없음
                        </div>
                      )
                    }

                    return scopeSources.map((s) => {
                      const oi = outerData.indexOf(s)
                      return (
                        <div
                          key={s.name}
                          className="flex items-center gap-1.5 px-1 py-0.5 cursor-default rounded"
                          style={{ background: activeOuter === oi ? "var(--bg-subtle)" : "transparent" }}
                          onMouseEnter={() => { setActiveOuter(oi); setActiveInner(null) }}
                          onMouseLeave={() => setActiveOuter(null)}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: 1, background: s.fill, flexShrink: 0, display: "inline-block" }} />
                          <span className="flex-1 text-[10px] truncate" style={{ color: "var(--fg-2)" }}>{s.name}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-3)", flexShrink: 0 }}>
                            {total > 0 ? ((s.value / total) * 100).toFixed(1) : "0"}%
                          </span>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
