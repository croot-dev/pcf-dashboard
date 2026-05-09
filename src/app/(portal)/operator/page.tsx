"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PageLayout } from "@/components/layout/PageLayout"
import { useExcelImport } from "./_hooks/useExcelImport"
import { ActivityPreviewTable } from "./_components/ActivityPreviewTable"
import { ColumnMappingCard } from "./_components/ColumnMappingCard"
import { EmissionFactorHistory } from "./_components/EmissionFactorHistory"
import { EmissionFactorVersionForm } from "./_components/EmissionFactorVersionForm"
import { UploadFilePanel } from "./_components/UploadFilePanel"
import { RowEvidenceEditor } from "./_components/RowEvidenceEditor"
import type { FactorForm, FlowStepName } from "./_components/types"
import type { OperEmissionFactor } from "@/lib/upload/"

const ACTIVITY_COLORS = ["#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899"]

const STEP_ORDER: { id: FlowStepName; label: string }[] = [
  { id: "upload",     label: "파일 업로드" },
  { id: "mapping",    label: "컬럼 매핑"   },
  { id: "validation", label: "유효성 검사" },
  { id: "commit",     label: "최종 저장"   },
]

const INITIAL_FACTOR_FORM: FactorForm = {
  activityType: "전기",
  sourceName: "한국전력",
  scope: "2",
  unit: "kWh",
  factor: "",
  validFrom: new Date().toISOString().slice(0, 10),
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.error ?? "요청을 처리하지 못했습니다.")
  }

  return body as T
}

export default function OperatorPage() {
  const {
    fileName,
    sheetName,
    rows,
    mappings,
    sourceHeaders,
    summary,
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
  } = useExcelImport()

  const flowSteps = useMemo(
    () => STEP_ORDER.map((step, i) => ({
      ...step,
      done: i < STEP_ORDER.findIndex((s) => s.id === currentStep),
      current: step.id === currentStep,
    })),
    [currentStep]
  )

  const [factorsList, setFactorsList] = useState<OperEmissionFactor[]>([])
  const [factorForm, setFactorForm] = useState<FactorForm>(INITIAL_FACTOR_FORM)

  async function loadFactorsWithState() {
    const response = await fetch("/api/emission-factors")
    const body = await parseJsonResponse<{ factors: OperEmissionFactor[] }>(response)
    setFactorsList(body.factors)
  }

  async function createFactorVersion() {
    try {
      const response = await fetch("/api/emission-factors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(factorForm),
      })
      await parseJsonResponse<{ factor: OperEmissionFactor }>(response)
      await loadFactorsWithState()
      if (rows.length > 0) await revalidateRows()
      setFactorForm(INITIAL_FACTOR_FORM)
      toast.success("배출계수 새 버전을 추가했습니다.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "배출계수 추가에 실패했습니다.")
    }
  }

  return (
    <PageLayout title={{ ko: "실무자 View 대시보드", en: "Operator Dashboard" }}>
      <div className="mx-auto grid w-full max-w-[1440px] min-w-[1040px] grid-cols-12 gap-4 px-6 py-5">
        <UploadFilePanel
          fileName={fileName}
          sheetName={sheetName}
          summary={summary}
          flowSteps={flowSteps}
          currentStep={currentStep}
          isLoading={isLoading}
          onFileAccepted={handleFileUpload}
        />
        <ColumnMappingCard
          mappings={mappings}
          sourceHeaders={sourceHeaders}
          isLoading={isLoading}
          onApplyMappings={applyMappings}
        />

        <ActivityPreviewTable
          rows={filteredRows}
          selectedRowId={selectedRowId}
          query={query}
          summary={summary}
          isLoading={isLoading}
          onQueryChange={setQuery}
          onSelectRow={setSelectedRowId}
          onRevalidate={() => revalidateRows()}
          onCommit={commitRows}
        />

        <RowEvidenceEditor
          row={selectedRow}
          isLoading={isLoading}
          onChange={updateSelectedRow}
          onRevalidate={() => revalidateRows()}
        />

        <EmissionFactorVersionForm
          form={factorForm}
          isLoading={isLoading}
          onChange={setFactorForm}
          onSubmit={createFactorVersion}
        />
        <EmissionFactorHistory
          factors={factorsList}
          isLoading={isLoading}
          onLoadFactors={loadFactorsWithState}
        />
      </div>
    </PageLayout>
  )
}
