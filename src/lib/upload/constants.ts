import type { ColumnMapping } from "@/lib/upload"

export const MAPPINGS: ColumnMapping[] = [
  { source: "일자(원본)", target: "date" },
  { source: "활동 유형", target: "activityType" },
  { source: "설명", target: "sourceName" },
  { source: "량", target: "amount" },
  { source: "단위", target: "unit" },
]
