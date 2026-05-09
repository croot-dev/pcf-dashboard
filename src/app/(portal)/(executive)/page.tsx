"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { DashboardData } from "@/lib/dashboard/types"
import { HeroKPI } from "./_components/HeroKPI"
import { SourceBreakdownDonut } from "./_components/SourceBreakdownDonut"
import { StackedActivityChart } from "./_components/StackedActivityChart"
import { MoMVarianceChart } from "./_components/MoMVarianceChart"
import { PageLayout } from "@/components/layout/PageLayout"
import { StackedYoYChart } from "./_components/StackedYoYChart"
import { PCFTable } from "./_components/PCFTable"
import dayjs from "dayjs"

function DashboardContent() {
  const searchParams = useSearchParams()
  const period = searchParams.get("period") ?? dayjs().format("YYYY")
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboardData() {
      setError(null)
      setData(null)

      try {
        const response = await fetch(`/api/executive/summary?period=${period}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Dashboard API failed with ${response.status}`)
        }

        setData((await response.json()) as DashboardData)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : "대시보드 데이터를 불러오지 못했습니다.")
      }
    }

    loadDashboardData()

    return () => controller.abort()
  }, [period])

  if (error) {
    return <div style={{ padding: 32, color: "var(--danger-700)" }}>{error}</div>
  }

  if (!data) {
    return <div style={{ padding: 32, color: "var(--fg-3)" }}>대시보드 데이터를 불러오는 중...</div>
  }

  return (
    <div
      style={{
        padding: "20px 24px 48px",
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: 16,
        minWidth: 960,
        maxWidth: 1440,
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* Row 1: Hero KPI · Source Donut · Data Integrity */}
      <div style={{ gridColumn: "span 3", display: "flex", flexDirection: "column" }}>
        <HeroKPI d={data} />
      </div>

      {/* <div style={{ gridColumn: "span 3", display: "flex", flexDirection: "column" }}>
        <ScopeBreakdownDonut scope={data.scope} />
      </div> */}

      <div style={{ gridColumn: "span 9", display: "flex", flexDirection: "column" }}>
        <StackedActivityChart data={data.activity} />
      </div>

      <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column" }}>
        <SourceBreakdownDonut sources={data.sources} />
      </div>
      <div style={{ gridColumn: "span 8", display: "flex", flexDirection: "column" }}>
        <PCFTable rows={data.pcfTable} />
      </div>

      <div style={{ gridColumn: "span 6", display: "flex", flexDirection: "column" }}>
        <MoMVarianceChart monthly={data.monthly} />
      </div>
      <div style={{ gridColumn: "span 6", display: "flex", flexDirection: "column" }}>
        <StackedYoYChart data={data.yoyActivity} year={Number(period)} />
      </div>

    </div>
  )
}

export default function DashboardPage() {
  return (
    <PageLayout title={{ ko: "경영자 View 대시보드", en: "Executive Dashboard" }}>
      <Suspense fallback={<div style={{ padding: 32, color: "var(--fg-3)" }}>불러오는 중…</div>}>
        <DashboardContent />
      </Suspense>
    </PageLayout>
  )
}
