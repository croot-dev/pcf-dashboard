"use client"

import { History, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { FactorForm } from "./types"

type Props = {
  form: FactorForm
  isLoading: boolean
  onChange: (form: FactorForm) => void
  onSubmit: () => void
}

export function EmissionFactorVersionForm({ form, isLoading, onChange, onSubmit }: Props) {
  return (
    <Card className="col-span-4 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="flex items-center gap-2 text-[13px]">
          <History className="size-4" />
          배출계수 버전 추가
        </CardTitle>
        <CardDescription className="text-[11px]">기존 값을 덮어쓰지 않고 새 버전을 생성</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 p-5">
        <Input value={form.activityType} onChange={(e) => onChange({ ...form, activityType: e.target.value })} placeholder="활동 유형" />
        <Input value={form.sourceName} onChange={(e) => onChange({ ...form, sourceName: e.target.value })} placeholder="배출원" />
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={form.scope}
          onChange={(e) => onChange({ ...form, scope: e.target.value as FactorForm["scope"] })}
        >
          <option value="1">Scope 1</option>
          <option value="2">Scope 2</option>
          <option value="3">Scope 3</option>
        </select>
        <Input value={form.unit} onChange={(e) => onChange({ ...form, unit: e.target.value })} placeholder="단위" />
        <Input value={form.factor} onChange={(e) => onChange({ ...form, factor: e.target.value })} placeholder="계수" />
        <Input type="date" value={form.validFrom} onChange={(e) => onChange({ ...form, validFrom: e.target.value })} />
        <Button className="col-span-2" size="sm" disabled={isLoading} onClick={onSubmit}>
          <Plus />
          새 버전 추가
        </Button>
      </CardContent>
    </Card>
  )
}
