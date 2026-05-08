import { Zap, Package, Truck } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { RecordCounts } from "@/lib/mock-data"

interface Props {
  counts: RecordCounts
  total: number
}

const ROWS = [
  { key: "electricity" as const, label: "전기",   sub: "kWh",    icon: Zap,     color: "#8b5cf6" },
  { key: "rawMaterial" as const, label: "원소재", sub: "kg",     icon: Package, color: "#0ea5e9" },
  { key: "transport"   as const, label: "운송",   sub: "ton-km", icon: Truck,   color: "#10b981" },
]

export function DataIntegrityCard({ counts, total }: Props) {
  return (
    <Card className="flex-1 gap-0 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-[13px] font-semibold">데이터 수집 현황</CardTitle>
        <CardDescription className="text-[11px]">활동 유형별 레코드 수</CardDescription>
      </CardHeader>
      <CardContent className="p-5 flex flex-col gap-2.5">
        {ROWS.map(({ key, label, sub, icon: Icon, color }) => {
          const count = counts[key]
          const pct = (count / total) * 100
          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={13} color={color} />
                <span className="text-xs font-medium flex-1">{label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color }}>
                  {count}건
                </span>
                <span style={{ fontSize: 10, color: "var(--fg-3)", width: 44, textAlign: "right", fontFamily: "var(--font-mono)" }}>
                  {sub}
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: color, opacity: 0.75 }}
                />
              </div>
            </div>
          )
        })}
        <div
          className="flex justify-between pt-2.5 mt-1.5 border-t"
          style={{ fontSize: 11, color: "var(--fg-3)" }}
        >
          <span>총 레코드</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--fg-1)" }}>
            {total}건
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
