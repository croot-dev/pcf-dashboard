"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Download } from "lucide-react"
import { usePageTitle } from "./TitleContext"

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const title = usePageTitle()

  const isExecDashboard = pathname === "/"
  const period = searchParams.get("period") ?? ""

  const [years, setYears] = useState<number[]>([])

  function setPeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", value)
    router.push(`?${params.toString()}`)
  }

  useEffect(() => {
    if (!isExecDashboard) return
    fetch("/api/executive/years")
      .then((r) => r.json())
      .then(({ years: ys }: { years: number[] }) => {
        setYears(ys)
        if (ys.length > 0 && !/^\d{4}$/.test(period)) {
          setPeriod(String(ys[0]))
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExecDashboard])

  return (
    <header
      style={{
        height: 56,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
        background: "rgba(255,255,255,.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Title */}
      <div>
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
          {title.ko}
          <span style={{ color: "var(--fg-3)", fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
            {title.en}
          </span>
        </h1>
        {title.product && (
          <div
            style={{
              fontSize: 11,
              color: "var(--fg-3)",
              marginTop: 1,
              fontFamily: "var(--font-mono)",
            }}
          >
            {title.product}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Year selector — exec dashboard only */}
      {isExecDashboard && years.length > 0 && (
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{
            height: 30,
            padding: "0 28px 0 10px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            color: "var(--fg-2)",
            cursor: "pointer",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 8px center",
          }}
        >
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}년
            </option>
          ))}
        </select>
      )}

      {/* Download */}
      {isExecDashboard && (
        <button
          style={{
            height: 30,
            padding: "0 10px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--fg-2)",
            cursor: "pointer",
          }}
        >
          <Download size={13} />
          리포트
        </button>
      )}
    </header>
  )
}
