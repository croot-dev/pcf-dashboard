"use client"

import { CheckCircle2, Download, FileSpreadsheet, UploadCloud } from "lucide-react"
import { toast } from "sonner"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ImportSummary } from "@/lib/upload"
import type { FlowStep, FlowStepName } from "./types"
import { getValidationColor } from "./operator-ui"

type Props = {
  fileName: string
  sheetName: string
  summary: ImportSummary
  flowSteps: FlowStep[]
  currentStep: FlowStepName
  isLoading: boolean
  onFileAccepted: (file: File) => void
}

export function UploadFilePanel({
  fileName,
  sheetName,
  summary,
  flowSteps,
  currentStep,
  isLoading,
  onFileAccepted,
}: Props) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    disabled: isLoading,
    maxFiles: 1,
    multiple: false,
    noClick: true,
    onDropAccepted: ([file]) => {
      if (file) onFileAccepted(file)
    },
    onDropRejected: () => {
      toast.error("Excel 또는 CSV 파일만 업로드할 수 있습니다.")
    },
  })

  return (
    <Card className="col-span-8 py-0">
      <CardContent className="grid grid-cols-[1.1fr_1.4fr] gap-5 p-5">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold">데이터 임포트</h2>
              <p className="text-xs text-muted-foreground">
                템플릿과 양식이 다르다면 컬럼 매핑 단계에서 조정할 수 있습니다.
              </p>
            </div>
            <a
              href="/data/TEMPLATE.xlsx"
              download="TEMPLATE.xlsx"
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Download className="size-3.5" />
              템플릿
            </a>
          </div>
          <div
            {...getRootProps()}
            className="flex h-[168px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 outline-none transition-colors"
            style={{
              borderColor: isDragActive ? "var(--info-500)" : "var(--border)",
              background: isDragActive ? "var(--info-50)" : undefined,
            }}
          >
            <UploadCloud className="mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">{fileName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isDragActive ? "여기에 파일을 놓아 업로드" : `시트: ${sheetName} · ${summary.total}행 감지`}
            </p>
            <input {...getInputProps()} />
            <Button
              className="mt-4"
              size="sm"
              disabled={isLoading}
              onClick={open}
            >
              <UploadCloud />
              Excel 선택
            </Button>
          </div>
        </div>

        <div className="grid content-start gap-4">
<div className="grid grid-cols-4 gap-2">
             {flowSteps.map((step, index) => (
               <div
                 key={step.label}
                 className="rounded-lg border bg-background p-3"
                 style={{
                   borderColor: step.current ? "var(--primary)" : undefined,
                   background: step.current ? "var(--primary-50)" : undefined,
                 }}
               >
                 <div className="mb-2 flex items-center justify-between">
                   <span className="text-[11px] text-muted-foreground">STEP {index + 1}</span>
                   {step.done ? (
                     <CheckCircle2 className="size-4 text-success" />
                   ) : step.current ? (
                     <span className="size-2 rounded-full bg-primary" />
                   ) : (
                     <span className="size-4 rounded-full border" />
                   )}
                 </div>
                 <p className="text-sm font-semibold">{step.label}</p>
               </div>
             ))}
           </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "전체 행", value: summary.total, tone: "valid" as const },
              { label: "정상 행", value: summary.valid, tone: "valid" as const },
              { label: "검토 행", value: summary.warning, tone: "warning" as const },
              { label: "오류 행", value: summary.error, tone: "error" as const },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border bg-background p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p
                  className="mt-1 font-mono text-2xl font-semibold"
                  style={{ color: getValidationColor(item.tone) }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
