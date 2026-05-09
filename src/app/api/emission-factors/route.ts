import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getActiveEmissionFactors, toOperEmissionFactor } from "@/lib/upload/import"

export const dynamic = "force-dynamic"

const CreateFactorSchema = z.object({
  activityType: z.string().min(1),
  sourceName: z.string().min(1),
  scope: z.enum(["1", "2", "3"]),
  unit: z.string().min(1),
  factor: z.coerce.number().positive(),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

function date(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function previousDay(value: Date) {
  const next = new Date(value)
  next.setUTCDate(next.getUTCDate() - 1)
  return next
}

/**
 * @swagger
 * /api/emission-factors:
 *   get:
 *     tags:
 *       - Emission Factors
 *     summary: 활성 배출계수 목록 조회
 *     description: >
 *       현재 유효한 배출계수 목록을 반환합니다. 실무자 화면의 검증과 배출계수 이력 조회에 사용합니다.
 *     responses:
 *       200:
 *         description: 활성 배출계수 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [factors]
 *               properties:
 *                 factors:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/EmissionFactor"
 *       500:
 *         description: 배출계수 목록 조회 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
export async function GET() {
  try {
    return NextResponse.json({ factors: await getActiveEmissionFactors() })
  } catch (error) {
    console.error("Failed to load emission factors", error)
    return NextResponse.json({ error: "배출계수 목록을 불러오지 못했습니다." }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/emission-factors:
 *   post:
 *     tags:
 *       - Emission Factors
 *     summary: 배출계수 새 버전 추가
 *     description: >
 *       활동유형·Scope·배출원·단위 조합에 대한 새 배출계수 버전을 생성합니다.
 *       같은 조합의 기존 활성 버전은 새 validFrom 전날로 validTo를 닫습니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activityType, sourceName, scope, unit, factor, validFrom]
 *             properties:
 *               activityType:
 *                 type: string
 *                 example: "전기"
 *               sourceName:
 *                 type: string
 *                 example: "한국전력"
 *               scope:
 *                 type: string
 *                 enum: ["1", "2", "3"]
 *                 example: "2"
 *               unit:
 *                 type: string
 *                 example: "kWh"
 *               factor:
 *                 type: number
 *                 minimum: 0
 *                 example: 0.456
 *               validFrom:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-01"
 *     responses:
 *       201:
 *         description: 생성된 배출계수 버전
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [factor]
 *               properties:
 *                 factor:
 *                   $ref: "#/components/schemas/EmissionFactor"
 *       400:
 *         description: 배출계수 생성 요청 검증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
export async function POST(request: Request) {
  try {
    const input = CreateFactorSchema.parse(await request.json())
    const validFrom = date(input.validFrom)

    const created = await prisma.$transaction(async (tx) => {
      await tx.emissionFactor.updateMany({
        where: {
          deletedAt: null,
          activityType: input.activityType,
          scope: input.scope,
          sourceName: input.sourceName,
          unit: input.unit,
          validFrom: { lt: validFrom },
          OR: [{ validTo: null }, { validTo: { gte: validFrom } }],
        },
        data: {
          validTo: previousDay(validFrom),
        },
      })

      return tx.emissionFactor.create({
        data: {
          activityType: input.activityType,
          sourceName: input.sourceName,
          scope: input.scope,
          unit: input.unit,
          factor: input.factor,
          validFrom,
          validTo: null,
        },
      })
    })

    return NextResponse.json({ factor: await toOperEmissionFactor(created) }, { status: 201 })
  } catch (error) {
    console.error("Failed to create emission factor version", error)
    return NextResponse.json({ error: "배출계수 버전을 추가하지 못했습니다." }, { status: 400 })
  }
}
