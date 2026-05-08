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

export async function GET() {
  try {
    return NextResponse.json({ factors: await getActiveEmissionFactors() })
  } catch (error) {
    console.error("Failed to load emission factors", error)
    return NextResponse.json({ error: "배출계수 목록을 불러오지 못했습니다." }, { status: 500 })
  }
}

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

    return NextResponse.json({ factor: toOperEmissionFactor(created) }, { status: 201 })
  } catch (error) {
    console.error("Failed to create emission factor version", error)
    return NextResponse.json({ error: "배출계수 버전을 추가하지 못했습니다." }, { status: 400 })
  }
}
