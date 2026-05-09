import type { ImportRow } from "@/lib/upload"

export type FlowStepName = "upload" | "mapping" | "validation" | "commit"

export type FlowStep = {
  label: string
  done: boolean
  current?: boolean
}

export type TaskProgressItem = {
  activityType: string
  color: string
  done: number
  total: number
}

export type FactorForm = {
  activityType: string
  sourceName: string
  scope: "1" | "2" | "3"
  unit: string
  factor: string
  validFrom: string
}

export type EditableImportField = keyof Pick<
  ImportRow,
  "date" | "activityType" | "sourceName" | "amount" | "unit"
>
