import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ActivityPoint, FactorRow } from "@/lib/mock-data"

const SCOPE_COLOR: Record<1 | 2 | 3, string> = { 1: "#0ea5e9", 2: "#8b5cf6", 3: "#10b981" }

type ActivityKey = "electricity" | "plastic1" | "plastic2" | "truck"

function toActivityKey(f: FactorRow): ActivityKey {
  const at = f.activityType.toLowerCase()
  const sn = f.sourceName.toLowerCase()
  if (at.includes("전기") || at.includes("electric")) return "electricity"
  if (at.includes("운송") || at.includes("transport")) return "truck"
  if (sn.includes("2") || sn.includes("철강") || sn.includes("steel")) return "plastic2"
  return "plastic1"
}

function computeProportions(data: ActivityPoint[]): Record<ActivityKey, number> {
  const totals: Record<ActivityKey, number> = { electricity: 0, plastic1: 0, plastic2: 0, truck: 0 }
  for (const p of data) {
    totals.electricity += p.electricity
    totals.plastic1    += p.plastic1
    totals.plastic2    += p.plastic2
    totals.truck       += p.truck
  }
  const total = totals.electricity + totals.plastic1 + totals.plastic2 + totals.truck
  if (total === 0) return { electricity: 0, plastic1: 0, plastic2: 0, truck: 0 }
  return {
    electricity: (totals.electricity / total) * 100,
    plastic1:    (totals.plastic1    / total) * 100,
    plastic2:    (totals.plastic2    / total) * 100,
    truck:       (totals.truck       / total) * 100,
  }
}

interface Props {
  data: ActivityPoint[]
  factors: FactorRow[]
}

export function EmissionFactorsCard({ data, factors }: Props) {
  const pct = computeProportions(data)
  const rows = [...factors].sort((a, b) => pct[toActivityKey(b)] - pct[toActivityKey(a)])

  return (
    <Card className="flex-1 gap-0 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-[13px] font-semibold">배출계수 현황</CardTitle>
        <CardDescription className="text-[11px]">현재 적용 중인 배출계수</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {rows.map((f, i) => {
          const key = toActivityKey(f)
          const color = SCOPE_COLOR[f.scope]
          return (
            <div
              key={`${f.activityType}-${f.sourceName}`}
              className="flex items-center gap-3 px-5 py-2.5"
              style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <Badge
                variant="outline"
                className="text-[9px] h-auto px-1.5 py-0.5 font-semibold border-transparent shrink-0"
                style={{ background: `${color}1a`, color }}
              >
                S{f.scope}
              </Badge>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">
                  {f.activityType} ({f.sourceName})
                </div>
              </div>

              <div className="text-right shrink-0">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>
                  {f.factor}
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>
                  kgCO₂e / {f.unit}
                </div>
              </div>

              <div className="shrink-0" style={{ width: 52 }}>
                <div
                  className="text-right"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color }}
                >
                  {pct[key].toFixed(1)}%
                </div>
                <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct[key]}%`, background: color, opacity: 0.75 }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
