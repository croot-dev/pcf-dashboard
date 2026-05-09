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
import type { ImportRow } from "@/lib/upload"
import type { EditableImportField } from "./types"
import { getStatusBadgeVariant, getStatusLabel } from "./operator-ui"

const FIELD_LABEL: Record<EditableImportField, string> = {
  date: "날짜",
  activityType: "활동유형",
  sourceName: "배출원",
  unit: "단위",
  amount: "사용량",
}

function parseAmount(value: string) {
  const normalized = value.replace(/,/g, "").trim()
  if (normalized === "") return Number.NaN
  return Number(normalized)
}

function getFieldError(field: EditableImportField, value: string) {
  const trimmed = value.trim()

  if (field !== "amount" && trimmed === "") return `${FIELD_LABEL[field]}은 필수입니다.`

  if (field === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "날짜는 YYYY-MM-DD 형식이어야 합니다."
  }

  if (field === "amount") {
    const amount = parseAmount(trimmed)
    if (!Number.isFinite(amount) || amount < 0) return "사용량은 0 이상의 숫자여야 합니다."
  }

  return null
}

function FieldInput({
  field,
  value,
  className,
  onChange,
}: {
  field: EditableImportField
  value: string
  className?: string
  onChange: (field: EditableImportField, value: string) => void
}) {
  const error = getFieldError(field, value)

  return (
    <label className={`space-y-1 ${className ?? ""}`}>
      <span className="text-[10px] font-medium text-muted-foreground">{FIELD_LABEL[field]}</span>
      <Input
        value={value}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(field, e.target.value)}
        className={error ? "border-danger focus-visible:ring-danger/40" : undefined}
      />
      {error && <span className="block text-[10px] leading-tight text-danger">{error}</span>}
    </label>
  )
}

type Props = {
  row: ImportRow | null
  isLoading: boolean
  onChange: (field: EditableImportField, value: string) => void
  onRevalidate: () => void
}

export function RowEvidenceEditor({ row, isLoading, onChange, onRevalidate }: Props) {
  const hasClientErrors = row
    ? (["date", "activityType", "sourceName", "unit", "amount"] as EditableImportField[])
      .some((field) => getFieldError(field, row[field]))
    : false

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
              <FieldInput field="date" value={row.date} onChange={onChange} />
              <FieldInput field="activityType" value={row.activityType} onChange={onChange} />
              <FieldInput field="sourceName" value={row.sourceName} onChange={onChange} />
              <FieldInput field="unit" value={row.unit} onChange={onChange} />
              <FieldInput field="amount" value={row.amount} className="col-span-2" onChange={onChange} />
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

            <Button className="w-full" size="sm" disabled={isLoading || hasClientErrors} onClick={onRevalidate}>
              <RefreshCw />
              {hasClientErrors ? "입력값을 먼저 확인하세요" : "수정 값 다시 검증"}
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
