import type { ImportRow } from "@/lib/upload"

export function getStatusLabel(status: ImportRow["status"]) {
  if (status === "error") return "오류"
  if (status === "warning") return "검토"
  return "정상"
}

export function getStatusBadgeVariant(status: ImportRow["status"]) {
  if (status === "error") return "destructive" as const
  if (status === "warning") return "secondary" as const
  return "outline" as const
}

export function getValidationColor(tone: "valid" | "warning" | "error") {
  if (tone === "valid") return "var(--success-700)"
  if (tone === "error") return "var(--danger-700)"
  return "var(--warning-700)"
}
