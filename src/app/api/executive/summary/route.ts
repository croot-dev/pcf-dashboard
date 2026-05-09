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
    amount: Number(row.activityData.amount),
    activityUnit: row.activityData.unit,
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


/**
 * @swagger
 * /api/executive/summary:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: 경영자 대시보드 요약 데이터 조회
 *     description: >
 *       선택한 기간의 PCF 경영자 대시보드 데이터를 반환합니다.
 *       저장된 emissions 데이터를 기준으로 총 배출량, Scope별 월간 추이,
 *       Scope별 배출량, 배출원 Pareto, 제품별 단위 PCF, 배출계수 목록을 집계합니다.
 *     parameters:
 *       - in: query
 *         name: period
 *         required: false
 *         schema:
 *           type: string
 *           enum: [q1, q2, q3, q4, year]
 *           default: year
 *         description: 조회 기간입니다. 분기(q1~q4) 또는 연간(year)을 지정합니다.
 *     responses:
 *       200:
 *         description: 경영자 대시보드 요약 데이터
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - totalCO2
 *                 - deltaCO2
 *                 - lastImport
 *                 - recordCount
 *                 - recordCounts
 *                 - monthly
 *                 - activity
 *                 - products
 *                 - sources
 *                 - scope
 *                 - factors
 *               properties:
 *                 totalCO2:
 *                   type: number
 *                   example: 4821.36
 *                   description: 선택 기간의 총 배출량입니다. 단위는 kgCO2e입니다.
 *                 deltaCO2:
 *                   type: number
 *                   example: 12.4
 *                   description: 이전 동기간 대비 총 배출량 증감률입니다.
 *                 lastImport:
 *                   type: string
 *                   example: "2025-08-01 09:00"
 *                   description: 선택 기간 데이터 중 가장 최근 활동 데이터 생성 시각입니다.
 *                 recordCount:
 *                   type: integer
 *                   example: 30
 *                   description: 선택 기간의 활동 데이터 레코드 수입니다.
 *                 recordCounts:
 *                   type: object
 *                   required: [electricity, rawMaterial, transport]
 *                   properties:
 *                     electricity:
 *                       type: integer
 *                       example: 9
 *                     rawMaterial:
 *                       type: integer
 *                       example: 12
 *                     transport:
 *                       type: integer
 *                       example: 9
 *                 monthly:
 *                   type: array
 *                   description: 월별 총 배출량 추이입니다.
 *                   items:
 *                     type: object
 *                     required: [m, co2]
 *                     properties:
 *                       m:
 *                         type: string
 *                         example: "2025-08"
 *                       co2:
 *                         type: number
 *                         example: 1024.5
 *                 activity:
 *                   type: array
 *                   description: 월별 Scope별 배출량 추이입니다.
 *                   items:
 *                     type: object
 *                     required: [m, "Scope 1", "Scope 2", "Scope 3"]
 *                     properties:
 *                       m:
 *                         type: string
 *                         example: "08"
 *                       "Scope 1":
 *                         type: number
 *                         example: 0
 *                       "Scope 2":
 *                         type: number
 *                         example: 477.66
 *                       "Scope 3":
 *                         type: number
 *                         example: 4343.7
 *                 products:
 *                   type: array
 *                   description: 제품별 단위당 PCF 목록입니다.
 *                   items:
 *                     type: object
 *                     required: [code, name, unit, delta]
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: "CT-045"
 *                       name:
 *                         type: string
 *                         example: "CT-045"
 *                       unit:
 *                         type: number
 *                         example: 0.82
 *                         description: 제품 1개당 kgCO2e입니다.
 *                       delta:
 *                         type: number
 *                         example: 8.1
 *                 sources:
 *                   type: array
 *                   description: 배출원별 기여도 목록입니다.
 *                   items:
 *                     type: object
 *                     required: [name, value, scope]
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "원소재 · 플라스틱 1"
 *                       value:
 *                         type: number
 *                         example: 529
 *                       scope:
 *                         type: integer
 *                         enum: [1, 2, 3]
 *                         example: 3
 *                 scope:
 *                   type: object
 *                   required: [s1, s2, s3]
 *                   properties:
 *                     s1:
 *                       type: number
 *                       example: 0
 *                     s2:
 *                       type: number
 *                       example: 477.66
 *                     s3:
 *                       type: number
 *                       example: 4343.7
 *                 factors:
 *                   type: array
 *                   description: 현재 등록된 배출계수 목록입니다.
 *                   items:
 *                     type: object
 *                     required: [activityType, sourceName, scope, unit, factor]
 *                     properties:
 *                       activityType:
 *                         type: string
 *                         example: "전기"
 *                       sourceName:
 *                         type: string
 *                         example: "한국전력"
 *                       scope:
 *                         type: integer
 *                         enum: [1, 2, 3]
 *                         example: 2
 *                       unit:
 *                         type: string
 *                         example: "kWh"
 *                       factor:
 *                         type: number
 *                         example: 0.456
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") ?? ""

    if (!isValidPeriod(period)) {
      return NextResponse.json(
        { error: "Invalid period. Expected a 4-digit year (e.g., 2025)." },
        { status: 400 }
      )
    }

    const window = getPeriodWindow(Number(period))

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
        where: { deletedAt: null, validTo: null },
        select: { activityType: true, sourceName: true, scope: true, unit: true, factor: true, validFrom: true },
        orderBy: { validFrom: "desc" },
      }),
    ])

    // validTo: null인 중복 행이 있을 경우 복합키 당 최신 validFrom 기준 1건만 유지
    const seen = new Set<string>()
    const factors = activeFactors
      .filter((f) => {
        const key = `${f.activityType}|${f.scope}|${f.sourceName}|${f.unit}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((f) => ({
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
