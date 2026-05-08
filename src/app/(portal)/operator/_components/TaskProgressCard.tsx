import { PackageCheck } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { TaskProgressItem } from "./types"

type Props = {
  tasks: TaskProgressItem[]
}

export function TaskProgressCard({ tasks }: Props) {
  return (
    <Card className="col-span-4 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="flex items-center gap-2 text-[13px]">
          <PackageCheck className="size-4" />
          입력 데이터 정합성 현황
        </CardTitle>
        <CardDescription className="text-[11px]">오류 없는 행 기준 진행 상태</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {tasks.map((task) => {
          const pct = task.total > 0 ? (task.done / task.total) * 100 : 0

          return (
            <div key={task.activityType}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium">{task.activityType}</span>
                <span className="font-mono text-muted-foreground">
                  {task.done}/{task.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: task.color }} />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
