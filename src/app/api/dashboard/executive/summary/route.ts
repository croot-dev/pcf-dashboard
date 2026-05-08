import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  buildExecutiveDashboardData,
  getPeriodWindow,
  isValidPeriod,
  toInclusiveDateFilter,
  toScope,
  type DashboardEmissionRow,
} from "@/lib/dashboard/calculate"

export const dynamic = "force-dynamic"

type EmissionWithRelations = Awaited<ReturnType<typeof findEmissions>>[number]

async function findEmissions(dateFilter: { gte: Date; lte: Date }) {
  return prisma.emission.findMany({
    where: {
      deletedAt: null,
      activityData: {
        deletedAt: null,
        date: dateFilter,
      },
      emissionFactor: {
        deletedAt: null,
      },
    },
    include: {
      activityData: {
        include: {
          product: true,
          batch: true,
        },
      },
      emissionFactor: true,
    },
    orderBy: {
      activityData: {
        date: "asc",
      },
    },
  })
}

function toDashboardEmissionRow(row: EmissionWithRelations): DashboardEmissionRow {
  return {
    date: row.activityData.date,
    co2e: Number(row.co2e),
    activityType: row.activityData.activityType,
    sourceName: row.emissionFactor.sourceName,
    scope: toScope(row.emissionFactor.scope),
    createdAt: row.activityData.createdAt,
    productCode: row.activityData.product.code,
    productName: row.activityData.product.name,
    batchId: row.activityData.batch?.id ?? null,
    producedQuantity: row.activityData.batch ? Number(row.activityData.batch.producedQuantity) : null,
  }
}

async function findLatestActivityDate() {
  const latest = await prisma.activityData.findFirst({
    where: {
      deletedAt: null,
      emission: {
        deletedAt: null,
      },
    },
    orderBy: {
      date: "desc",
    },
    select: {
      date: true,
    },
  })

  return latest?.date ?? null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") ?? "year"

    if (!isValidPeriod(period)) {
      return NextResponse.json(
        { error: "Invalid period. Expected one of: q1, q2, q3, q4, year." },
        { status: 400 }
      )
    }

    const latestDate = await findLatestActivityDate()
    const anchor = latestDate ?? new Date()
    const window = getPeriodWindow(period, anchor)

    const [currentRows, previousRows, trendRows, activeFactors] = await Promise.all([
      findEmissions(toInclusiveDateFilter(window)),
      findEmissions({
        gte: window.previousStart,
        lte: window.previousEnd,
      }),
      findEmissions({
        gte: window.trendStart,
        lte: window.trendEnd,
      }),
      prisma.emissionFactor.findMany({
        where: { deletedAt: null },
        select: { activityType: true, sourceName: true, scope: true, unit: true, factor: true },
        orderBy: { activityType: "asc" },
      }),
    ])

    const factors = activeFactors.map((f) => ({
      activityType: f.activityType,
      sourceName: f.sourceName,
      scope: toScope(f.scope),
      unit: f.unit,
      factor: Number(f.factor),
    }))

    const data = buildExecutiveDashboardData({
      currentRows: currentRows.map(toDashboardEmissionRow),
      previousRows: previousRows.map(toDashboardEmissionRow),
      trendRows: trendRows.map(toDashboardEmissionRow),
      window,
      factors,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to build executive dashboard summary", error)
    return NextResponse.json(
      { error: "Failed to build executive dashboard summary." },
      { status: 500 }
    )
  }
}
