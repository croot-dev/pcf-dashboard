"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { MOCK_DATA, type PeriodId } from "@/lib/mock-data"
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
  const period = (searchParams.get("period") ?? "month") as PeriodId
  const d = MOCK_DATA[period]

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
        <HeroKPI d={d} />
      </div>
      <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column" }}>
        <SourceBreakdownDonut sources={d.sources} />
      </div>
      <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column" }}>
        <DataIntegrityCard counts={d.recordCounts} total={d.recordCount} />
      </div>

      {/* Row 2: Stacked Activity Chart · MoM Variance */}
      <div style={{ gridColumn: "span 8", display: "flex", flexDirection: "column" }}>
        <StackedActivityChart data={d.activity} />
      </div>
      <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column" }}>
        <MoMVarianceChart monthly={d.monthly} />
      </div>

      {/* Row 3: Pareto · Emission Factors */}
      <div style={{ gridColumn: "span 7", display: "flex", flexDirection: "column" }}>
        <ParetoChart sources={d.sources} />
      </div>
      <div style={{ gridColumn: "span 5", display: "flex", flexDirection: "column" }}>
        <EmissionFactorsCard data={d.activity} />
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
