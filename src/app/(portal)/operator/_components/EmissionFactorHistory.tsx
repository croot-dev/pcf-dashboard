"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, History, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { OperEmissionFactor } from "@/lib/upload/types"

type Props = {
  factors: OperEmissionFactor[]
  isLoading: boolean
  onLoadFactors: () => void
}

type FactorGroup = {
  key: string
  latest: OperEmissionFactor
  history: OperEmissionFactor[]
}

function factorKey(f: OperEmissionFactor) {
  return `${f.activityType}|${f.scope}|${f.sourceName}|${f.unit}`
}

function groupFactors(factors: OperEmissionFactor[]): FactorGroup[] {
  const map = new Map<string, OperEmissionFactor[]>()
  for (const f of factors) {
    const k = factorKey(f)
    const bucket = map.get(k) ?? []
    map.set(k, [...bucket, f])
  }
  return Array.from(map.entries()).map(([key, list]) => {
    const sorted = [...list].sort((a, b) => b.validFrom.localeCompare(a.validFrom))
    return { key, latest: sorted[0], history: sorted.slice(1) }
  })
}

export function EmissionFactorHistory({ factors, isLoading, onLoadFactors }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const groups = groupFactors(factors)

  function toggle(activityType: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(activityType)) next.delete(activityType)
      else next.add(activityType)
      return next
    })
  }

  return (
    <Card className="col-span-8 py-0">
      <CardHeader className="border-b px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-[13px]">
              <History className="size-4" />
              배출계수 이력
            </CardTitle>
            <CardDescription className="text-[11px]">
              활동 데이터 저장 시 이 계수 ID가 스냅샷으로 고정됩니다.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" disabled={isLoading} onClick={onLoadFactors}>
            <RefreshCw />
            계수 조회
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {groups.length === 0 ? (
          <div className="rounded-lg border bg-muted/30 p-5 text-center text-sm text-muted-foreground">
            계수 조회를 누르거나 Excel을 업로드하면 배출계수 이력이 표시됩니다.
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map(({ key, latest, history }) => {
              const isOpen = expanded.has(key)
              return (
                <div key={key} className="overflow-hidden rounded-lg border">
                  {/* 최신 버전 — 항상 표시 */}
                  <div className="flex items-start gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-semibold">{latest.activityType}</span>
                        <Badge variant="outline" className="h-5 text-[10px]">
                          Scope {latest.scope}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{latest.sourceName}</span>
                      </div>
                      <p className="font-mono text-sm font-medium">
                        {latest.factor} kgCO2e/{latest.unit}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {latest.validFrom} ~ {latest.validTo ?? "현재"}
                      </p>
                    </div>
                    {history.length > 0 && (
                      <button
                        onClick={() => toggle(key)}
                        className="mt-0.5 flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {isOpen
                          ? <ChevronDown className="size-3.5" />
                          : <ChevronRight className="size-3.5" />
                        }
                        이전 {history.length}건
                      </button>
                    )}
                  </div>

                  {/* 이전 이력 — 펼쳤을 때만 표시 */}
                  {isOpen && (
                    <div className="divide-y border-t bg-muted/20">
                      {history.map((h) => (
                        <div key={h.id} className="flex items-center gap-3 px-3 py-2">
                          <p className="min-w-0 flex-1 font-mono text-xs text-muted-foreground">
                            {h.factor} kgCO2e/{h.unit}
                          </p>
                          <p className="shrink-0 text-[11px] text-muted-foreground">
                            {h.validFrom} ~ {h.validTo ?? "현재"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
