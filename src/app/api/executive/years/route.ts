import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const rows = await prisma.activityData.findMany({
      where: { deletedAt: null },
      select: { date: true },
      distinct: ["date"],
    })

    const years = [...new Set(rows.map((r) => r.date.getUTCFullYear()))].sort((a, b) => b - a)

    return NextResponse.json({ years })
  } catch (error) {
    console.error("Failed to fetch available years", error)
    return NextResponse.json({ error: "연도 목록을 불러오지 못했습니다." }, { status: 500 })
  }
}
