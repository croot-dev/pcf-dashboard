import { TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { DashboardData } from "@/lib/mock-data"

interface Props {
  d: DashboardData
}

function Delta({ value }: { value: number }) {
  const isDown = value < 0
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[13px] font-medium"
      style={{ color: isDown ? "var(--success-700)" : "var(--danger-700)" }}
    >
      {isDown ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

export function HeroKPI({ d }: Props) {
  const tonne = d.totalCO2 / 1000

  return (
    <Card className="relative overflow-hidden flex-1 gap-0 py-0">
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "var(--hl-gradient)",
        }}
      />
      <CardContent className="flex flex-col pt-7 pb-5 px-7">
        <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fg-3)" }}>
          누적 배출량 · Total CO₂e
        </div>
        <div className="flex items-baseline gap-2 mt-2.5">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontVariantNumeric: "tabular-nums",
              fontSize: 48,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {tonne.toFixed(2)}
          </span>
          <span style={{ fontSize: 15, color: "var(--fg-3)", marginBottom: 2 }}>t CO₂e</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>
          {d.totalCO2.toLocaleString()} kg
        </div>
        <div className="flex items-center gap-2 mt-3.5">
          {d.deltaCO2 !== 0 ? (
            <>
              <Delta value={d.deltaCO2} />
              <span style={{ fontSize: 12, color: "var(--fg-3)" }}>전기 대비</span>
            </>
          ) : (
            <span style={{ fontSize: 12, color: "var(--fg-3)" }}>전년 비교 데이터 없음</span>
          )}
        </div>
        <div
          className="flex justify-between mt-3.5 pt-3 border-t"
          style={{ fontSize: 11, color: "var(--fg-3)" }}
        >
          <span>최근 입력 {d.lastImport}</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{d.recordCount}건</span>
        </div>
      </CardContent>
    </Card>
  )
}
