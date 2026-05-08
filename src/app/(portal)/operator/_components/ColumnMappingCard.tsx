"use client"

import { useState } from "react"
import { ArrowRight, ClipboardCheck, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ColumnMapping } from "@/lib/upload/types"

const TARGET_LABELS: Record<string, string> = {
  date: "일자",
  activityType: "활동 유형",
  sourceName: "배출원",
  amount: "사용량",
  unit: "단위",
}

type Props = {
  mappings: ColumnMapping[]
  sourceHeaders: string[]
  isLoading: boolean
  onApplyMappings: (mappings: ColumnMapping[]) => void
}

export function ColumnMappingCard({ mappings, sourceHeaders, isLoading, onApplyMappings }: Props) {
  const [prevMappings, setPrevMappings] = useState(mappings)
  const [overrides, setOverrides] = useState<Record<string, string>>({})

  // Reset overrides whenever the canonical mappings change externally (file upload / apply result)
  if (mappings !== prevMappings) {
    setPrevMappings(mappings)
    setOverrides({})
  }

  const local = mappings.map((m) => ({ ...m, source: overrides[m.target] ?? m.source }))
  const isDirty = Object.keys(overrides).length > 0
  const hasFile = sourceHeaders.length > 0

  function handleChange(target: string, newSource: string) {
    setOverrides((prev) => ({ ...prev, [target]: newSource }))
  }

  return (
    <Card className="col-span-4 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="flex items-center gap-2 text-[13px]">
          <ClipboardCheck className="size-4" />
          컬럼 매핑
        </CardTitle>
        <CardDescription className="text-[11px]">Excel 헤더를 시스템 필드에 연결</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="space-y-2">
          {local.map((mapping) => (
            <div
              key={mapping.target}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-md border p-2"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {TARGET_LABELS[mapping.target] ?? mapping.target}
              </span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
              {hasFile ? (
                <select
                  value={sourceHeaders.includes(mapping.source) ? mapping.source : ""}
                  disabled={isLoading}
                  onChange={(e) => handleChange(mapping.target, e.target.value)}
                  className="h-7 w-full rounded border bg-background px-2 font-mono text-xs text-info-dark outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">— 선택 —</option>
                  {sourceHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              ) : (
                <span className="font-mono text-xs text-info-dark">{mapping.source}</span>
              )}
            </div>
          ))}
        </div>

        {hasFile && (
          <Button
            size="sm"
            variant={isDirty ? "default" : "outline"}
            disabled={!isDirty || isLoading}
            className="w-full"
            onClick={() => onApplyMappings(local)}
          >
            <RefreshCw className="size-3.5" />
            재매핑 적용
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
