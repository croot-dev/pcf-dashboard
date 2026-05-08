"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { DashboardData, PeriodId } from "@/lib/mock-data"
import { HeroKPI } from "@/components/dashboard/widgets/HeroKPI"
import { SourceBreakdownDonut } from "@/components/dashboard/widgets/SourceBreakdownDonut"
import { DataIntegrityCard } from "@/components/dashboard/widgets/DataIntegrityCard"
import { StackedActivityChart } from "@/components/dashboard/widgets/StackedActivityChart"
import { MoMVarianceChart } from "@/components/dashboard/widgets/MoMVarianceChart"
import { ParetoChart } from "@/components/dashboard/widgets/ParetoChart"
import { EmissionFactorsCard } from "@/components/dashboard/widgets/EmissionFactorsCard"
import { PageLayout } from "@/components/layout/PageLayout"

function DashboardContent() {
  const searchParams = useSearchParams()
  const period = (searchParams.get("period") ?? "q3") as PeriodId
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboardData() {
      setError(null)
      setData(null)

      try {
        const response = await fetch(`/api/dashboard/executive/summary?period=${period}`, {
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
      <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column" }}>
        <HeroKPI d={data} />
      </div>
      <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column" }}>
        <SourceBreakdownDonut sources={data.sources} />
      </div>
      <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column" }}>
        <DataIntegrityCard counts={data.recordCounts} total={data.recordCount} />
      </div>

      {/* Row 2: Stacked Activity Chart · MoM Variance */}
      <div style={{ gridColumn: "span 8", display: "flex", flexDirection: "column" }}>
        <StackedActivityChart data={data.activity} />
      </div>
      <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column" }}>
        <MoMVarianceChart monthly={data.monthly} />
      </div>

      {/* Row 3: Pareto · Emission Factors */}
      <div style={{ gridColumn: "span 7", display: "flex", flexDirection: "column" }}>
        <ParetoChart sources={data.sources} />
      </div>
      <div style={{ gridColumn: "span 5", display: "flex", flexDirection: "column" }}>
        <EmissionFactorsCard data={data.activity} factors={data.factors} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <PageLayout title={{ ko: "경영자 View 대시보드", en: "Operator Dashboard" }}>
      <Suspense fallback={<div style={{ padding: 32, color: "var(--fg-3)" }}>불러오는 중…</div>}>
        <DashboardContent />
      </Suspense>
    </PageLayout>
  )
}
