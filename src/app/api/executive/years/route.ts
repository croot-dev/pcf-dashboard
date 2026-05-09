import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * @swagger
 * /api/executive/years:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: 대시보드 조회 가능 연도 목록
 *     description: >
 *       저장된 활동 데이터의 일자를 기준으로 경영자 대시보드에서 선택 가능한 연도 목록을 반환합니다.
 *       최신 연도가 먼저 오도록 내림차순 정렬합니다.
 *     responses:
 *       200:
 *         description: 조회 가능한 연도 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [years]
 *               properties:
 *                 years:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   example: [2025, 2024]
 *       500:
 *         description: 연도 목록 조회 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [error]
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "연도 목록을 불러오지 못했습니다."
 */
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
