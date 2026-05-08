"use client"

import { Info, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { ImportRow } from "@/lib/upload/types"
import type { EditableImportField } from "./types"
import { getStatusBadgeVariant, getStatusLabel } from "./operator-ui"

type Props = {
  row: ImportRow | null
  isLoading: boolean
  onChange: (field: EditableImportField, value: string) => void
  onRevalidate: () => void
}

export function RowEvidenceEditor({ row, isLoading, onChange, onRevalidate }: Props) {
  return (
    <Card className="col-span-4 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="flex items-center gap-2 text-[13px]">
          <Info className="size-4" />
          행 수정 및 산출 근거
        </CardTitle>
        <CardDescription className="text-[11px]">사용량 × 배출계수 = 배출량</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {row ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Input value={row.date} onChange={(e) => onChange("date", e.target.value)} />
              <Input value={row.activityType} onChange={(e) => onChange("activityType", e.target.value)} />
              <Input value={row.sourceName} onChange={(e) => onChange("sourceName", e.target.value)} />
              <Input value={row.unit} onChange={(e) => onChange("unit", e.target.value)} />
              <Input className="col-span-2" value={row.amount} onChange={(e) => onChange("amount", e.target.value)} />
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">{row.activityType} · {row.sourceName}</span>
                <Badge variant={getStatusBadgeVariant(row.status)} className="h-5 text-[10px]">
                  {getStatusLabel(row.status)}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-background p-3">
                  <p className="text-[11px] text-muted-foreground">사용량</p>
                  <p className="mt-1 font-mono text-sm font-semibold">{row.amount || "-"}</p>
                </div>
                <div className="rounded-md bg-background p-3">
                  <p className="text-[11px] text-muted-foreground">계수</p>
                  <p className="mt-1 font-mono text-sm font-semibold">{row.factor ?? "-"}</p>
                </div>
                <div className="rounded-md bg-background p-3">
                  <p className="text-[11px] text-muted-foreground">kgCO2e</p>
                  <p className="mt-1 font-mono text-sm font-semibold">{row.co2e ?? "-"}</p>
                </div>
              </div>
            </div>

            {(row.errors.length > 0 || row.warnings.length > 0) && (
              <div className="space-y-2">
                {row.errors.map((item, i) => (
                  <div key={i} className="rounded-lg border border-danger/30 bg-danger-subtle p-3 text-xs">
                    {item}
                  </div>
                ))}
                {row.warnings.map((item, i) => (
                  <div key={i} className="rounded-lg border border-warning/30 bg-warning-subtle p-3 text-xs">
                    {item}
                  </div>
                ))}
              </div>
            )}

            <Button className="w-full" size="sm" disabled={isLoading} onClick={onRevalidate}>
              <RefreshCw />
              수정 값 다시 검증
            </Button>
          </>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-5 text-center text-sm text-muted-foreground">
            Excel 파일을 업로드하면 행별 산출 근거가 표시됩니다.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
