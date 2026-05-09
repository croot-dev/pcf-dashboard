"use client"

import { Database, RefreshCw, Save, Search } from "lucide-react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
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
import type { ImportRow, ImportSummary } from "@/lib/upload"
import { getStatusBadgeVariant, getStatusLabel } from "./operator-ui"

type Props = {
  rows: ImportRow[]
  selectedRowId: string | null
  query: string
  summary: ImportSummary
  isLoading: boolean
  onQueryChange: (value: string) => void
  onSelectRow: (id: string) => void
  onRevalidate: () => void
  onCommit: () => void
}

const COLUMNS: ColumnDef<ImportRow>[] = [
  {
    accessorKey: "rowNumber",
    header: "행",
    size: 72,
    cell: ({ getValue }) => <span className="font-mono">{getValue<number>()}</span>,
  },
  {
    accessorKey: "date",
    header: "날짜",
    size: 110,
    cell: ({ getValue }) => <span className="font-mono">{getValue<string>()}</span>,
  },
  {
    accessorKey: "activityType",
    header: "활동 유형",
    size: 90,
  },
  {
    accessorKey: "sourceName",
    header: "배출원",
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">사용량</div>,
    size: 110,
    cell: ({ getValue }) => <div className="text-right font-mono">{getValue<string>()}</div>,
  },
  {
    accessorKey: "unit",
    header: "단위",
    size: 90,
    cell: ({ getValue }) => (
      <span className="font-mono text-muted-foreground">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "상태",
    size: 90,
    cell: ({ getValue }) => {
      const status = getValue<ImportRow["status"]>()
      return (
        <Badge variant={getStatusBadgeVariant(status)} className="h-5 text-[10px]">
          {getStatusLabel(status)}
        </Badge>
      )
    },
  },
]

export function ActivityPreviewTable({
  rows,
  selectedRowId,
  query,
  summary,
  isLoading,
  onQueryChange,
  onSelectRow,
  onRevalidate,
  onCommit,
}: Props) {
  const table = useReactTable({
    data: rows,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <Card className="col-span-8 py-0">
      <CardHeader className="border-b px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-[13px]">
              <Database className="size-4" />
              활동 데이터 프리뷰
            </CardTitle>
            <CardDescription className="text-[11px]">
              오류 행을 선택하고 오른쪽에서 수정
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-xs"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="활동 유형, 배출원 검색"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isLoading || rows.length === 0}
              onClick={onRevalidate}
            >
              <RefreshCw />
              다시 검증
            </Button>
            <Button
              size="sm"
              disabled={isLoading || rows.length === 0 || summary.error > 0}
              onClick={onCommit}
            >
              <Save />
              저장
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-[420px] overflow-auto p-0">
        <table className="w-full table-fixed text-left text-xs">
          <thead className="sticky top-0 border-b bg-muted text-[11px] text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2 font-medium"
                    style={
                      header.column.columnDef.size !== undefined
                        ? { width: header.column.getSize() }
                        : undefined
                    }
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b transition-colors hover:bg-muted/40"
                style={{
                  background: selectedRowId === row.id ? "var(--info-50)" : undefined,
                }}
                onClick={() => onSelectRow(row.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
