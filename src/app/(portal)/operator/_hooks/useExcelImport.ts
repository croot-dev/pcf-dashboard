"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import type {
  ColumnMapping,
  ImportCommitResponse,
  ImportPreviewResponse,
  ImportRow,
  ImportSummary,
  OperEmissionFactor,
} from "@/lib/upload/types"
import type { EditableImportField, FlowStepName } from "../_components/types"
import { MAPPINGS } from "@/lib/upload/constants"

const EMPTY_SUMMARY: ImportSummary = {
  total: 0,
  valid: 0,
  warning: 0,
  error: 0,
  duplicate: 0,
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json()
  if (!response.ok) {
    throw new Error(body.error ?? "요청을 처리하지 못했습니다.")
  }
  return body as T
}

export function useExcelImport() {
  const [fileName, setFileName] = useState("-")
  const [sheetName, setSheetName] = useState("-")
  const [rows, setRows] = useState<ImportRow[]>([])
  const [mappings, setMappings] = useState<ColumnMapping[]>(MAPPINGS)
  const [sourceHeaders, setSourceHeaders] = useState<string[]>([])
  const [summary, setSummary] = useState<ImportSummary>(EMPTY_SUMMARY)
  const [factors, setFactors] = useState<OperEmissionFactor[]>([])
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasCommitted, setHasCommitted] = useState(false)

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRowId) ?? rows[0] ?? null,
    [rows, selectedRowId]
  )

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return rows
    return rows.filter((row) =>
      [row.date, row.activityType, row.sourceName, row.amount, row.unit, row.status]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    )
  }, [query, rows])

  const currentStep: FlowStepName = useMemo(() => {
    if (rows.length === 0) return "upload"
    if (hasCommitted) return "commit"
    if (summary.error > 0) return "validation"
    return "mapping"
  }, [rows.length, hasCommitted, summary.error])

  async function withLoading(fn: () => Promise<void>, errorMsg: string) {
    setIsLoading(true)
    try {
      await fn()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  function applyPreview(data: ImportPreviewResponse) {
    setFileName(data.fileName)
    setSheetName(data.sheetName)
    setMappings(data.mappings)
    setSourceHeaders(data.sourceHeaders ?? [])
    setRows(data.rows)
    setSummary(data.summary)
    setFactors(data.factors)
    setSelectedRowId(data.rows[0]?.id ?? null)
    setHasCommitted(false)
  }

  async function handleFileUpload(file: File) {
    const formData = new FormData()
    formData.append("file", file)
    await withLoading(async () => {
      const response = await fetch("/api/import/preview", { method: "POST", body: formData })
      applyPreview(await parseJsonResponse<ImportPreviewResponse>(response))
      toast.success("Excel 파일을 파싱하고 검증했습니다.")
    }, "파일 업로드에 실패했습니다.")
  }

  function updateSelectedRow(field: EditableImportField, value: string) {
    if (!selectedRow) return
    setRows((current) =>
      current.map((row) => (row.id === selectedRow.id ? { ...row, [field]: value } : row))
    )
  }

  async function revalidateRows(nextRows = rows, nextMappings = mappings) {
    if (nextRows.length === 0) return
    await withLoading(async () => {
      const response = await fetch("/api/import/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, sheetName, rows: nextRows, mappings: nextMappings, sourceHeaders }),
      })
      applyPreview(await parseJsonResponse<ImportPreviewResponse>(response))
      toast.success("수정한 값을 기준으로 다시 검증했습니다.")
    }, "재검증에 실패했습니다.")
  }

  async function applyMappings(newMappings: ColumnMapping[]) {
    const getVal = (target: string) => newMappings.find((m) => m.target === target)?.source ?? ""

    const remappedRows = rows.map((row) => ({
      ...row,
      date: String(row.raw[getVal("date")] ?? "").trim(),
      activityType: String(row.raw[getVal("activityType")] ?? "").trim(),
      sourceName: String(row.raw[getVal("sourceName")] ?? "").trim(),
      amount: String(row.raw[getVal("amount")] ?? "").trim(),
      unit: String(row.raw[getVal("unit")] ?? "").trim(),
      errors: [],
      warnings: [],
    }))

    setMappings(newMappings)
    await revalidateRows(remappedRows, newMappings)
  }

  async function commitRows() {
    if (rows.length === 0) return
    await withLoading(async () => {
      const response = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      })
      const data = await parseJsonResponse<ImportCommitResponse>(response)
      setRows(data.rows)
      setSummary(data.summary)
      setHasCommitted(true)
      toast.success(`저장 완료: 신규 ${data.saved}건, 업데이트 ${data.updated}건, 제외 ${data.skipped}건`)
    }, "저장에 실패했습니다.")
  }

  async function loadFactors() {
    await withLoading(async () => {
      const response = await fetch("/api/emission-factors")
      const body = await parseJsonResponse<{ factors: OperEmissionFactor[] }>(response)
      setFactors(body.factors)
    }, "배출계수 목록을 불러오지 못했습니다.")
  }

  return {
    fileName,
    sheetName,
    rows,
    mappings,
    sourceHeaders,
    summary,
    factors,
    selectedRow,
    selectedRowId,
    filteredRows,
    currentStep,
    query,
    isLoading,
    setSelectedRowId,
    setQuery,
    handleFileUpload,
    updateSelectedRow,
    revalidateRows,
    applyMappings,
    commitRows,
    loadFactors,
  }
}