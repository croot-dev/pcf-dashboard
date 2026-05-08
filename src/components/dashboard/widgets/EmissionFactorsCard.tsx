import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EMISSION_FACTORS, ACTIVITY_SCOPE, type ActivityPoint } from "@/lib/mock-data"

const ROWS = [
  { label: "전기 (한국전력)",      key: "electricity" as const, unit: "kgCO₂e / kWh"  },
  { label: "원소재 (플라스틱 1)",  key: "plastic1"    as const, unit: "kgCO₂e / kg"   },
  { label: "원소재 (플라스틱 2)",  key: "plastic2"    as const, unit: "kgCO₂e / kg"   },
  { label: "운송 (트럭)",          key: "truck"       as const, unit: "kgCO₂e / t·km" },
]

const SCOPE_COLOR: Record<1 | 2 | 3, string> = { 1: "#0ea5e9", 2: "#8b5cf6", 3: "#10b981" }

type ActivityKey = "electricity" | "plastic1" | "plastic2" | "truck"

function computeProportions(data: ActivityPoint[]): Record<ActivityKey, number> {
  const totals: Record<ActivityKey, number> = {
    electricity: 0, plastic1: 0, plastic2: 0, truck: 0,
  }
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
}

export function EmissionFactorsCard({ data }: Props) {
  const pct = computeProportions(data)
  const sortedRows = [...ROWS].sort((a, b) => pct[b.key] - pct[a.key])

  return (
    <Card className="flex-1 gap-0 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-[13px] font-semibold">배출계수 현황</CardTitle>
        <CardDescription className="text-[11px]">YYYY.MM ~ 현재까지</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {sortedRows.map((row, i) => (
          <div
            key={row.key}
            className="flex items-center gap-3 px-5 py-2.5"
            style={{ borderBottom: i < sortedRows.length - 1 ? "1px solid var(--border)" : "none" }}
          >
            <Badge
              variant="outline"
              className="text-[9px] h-auto px-1.5 py-0.5 font-semibold border-transparent shrink-0"
              style={{ background: `${SCOPE_COLOR[ACTIVITY_SCOPE[row.key]]}1a`, color: SCOPE_COLOR[ACTIVITY_SCOPE[row.key]] }}
            >
              S{ACTIVITY_SCOPE[row.key]}
            </Badge>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{row.label}</div>
            </div>

            <div className="text-right shrink-0">
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>
                {EMISSION_FACTORS[row.key]}
              </div>
              <div className="text-[9px] mt-0.5" style={{ color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>
                {row.unit}
              </div>
            </div>

            <div className="shrink-0" style={{ width: 52 }}>
              <div
                className="text-right"
                style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: SCOPE_COLOR[ACTIVITY_SCOPE[row.key]] }}
              >
                {pct[row.key].toFixed(1)}%
              </div>
              <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct[row.key]}%`, background: SCOPE_COLOR[ACTIVITY_SCOPE[row.key]], opacity: 0.75 }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
