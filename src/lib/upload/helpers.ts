import dayjs from "@/lib/dayjs"

import type {
  ImportRow,
  ImportSummary,
  ImportStatus,
} from "@/lib/upload"

export function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()[\]{}·_\-/]/g, "")
}


export function isRowMostlyEmpty(row: unknown[]) {
  return row.every((cell) => String(cell ?? "").trim() === "")
}


export function toNumber(value: string) {
  const normalized = value.replace(/,/g, "").trim()
  if (normalized === "") return Number.NaN
  return Number(normalized)
}

export function round(value: number, digits = 4) {
  return Number(value.toFixed(digits))
}

export function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

  const d = dayjs.utc(value)
  if (!d.isValid()) return null

  return d.toDate()
}


export function summarizeImportRows(rows: ImportRow[]): ImportSummary {
  return {
    total: rows.length,
    valid: rows.filter((row) => row.status === "valid").length,
    warning: rows.filter((row) => row.status === "warning").length,
    error: rows.filter((row) => row.status === "error").length,
    duplicate: rows.filter((row) => row.warnings.some((warning) => warning.includes("중복"))).length,
  }
}


export function getStatus(errors: string[], warnings: string[]): ImportStatus {
  if (errors.length > 0) return "error"
  if (warnings.length > 0) return "warning"
  return "valid"
}
