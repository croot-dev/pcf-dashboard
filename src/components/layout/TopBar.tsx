"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Download } from "lucide-react"
import { PERIODS } from "@/lib/mock-data"
import { usePageTitle } from "./TitleContext"

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const title = usePageTitle()

  const isOperDashboard = pathname === "/"
  const period = searchParams.get("period") ?? "month"
  const currentPeriod = PERIODS.find((p) => p.id === period) ?? PERIODS[0]

  function setPeriod(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", id)
    router.push(`?${params.toString()}`)
  }
  
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

      {/* Period toggle — dashboard only */}
      {isOperDashboard && (
        <div
          style={{
            display: "inline-flex",
            padding: 3,
            borderRadius: "var(--radius-md)",
            background: "var(--bg-muted)",
            gap: 0,
          }}
        >
          {PERIODS.map((p) => {
            const active = p.id === period
            return (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                style={{
                  height: 28,
                  padding: "0 12px",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  background: active ? "var(--surface)" : "transparent",
                  boxShadow: active ? "var(--shadow-sm)" : "none",
                  color: active ? "var(--fg-1)" : "var(--fg-3)",
                  fontWeight: active ? 600 : 500,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all .15s ease-out",
                }}
              >
                {p.ko}
              </button>
            )
          })}
        </div>
      )}

      {/* Range display */}
      {isOperDashboard && (
        <div
          style={{
            height: 30,
            padding: "0 10px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            display: "inline-flex",
            alignItems: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--fg-2)",
          }}
        >
          {currentPeriod.range}
        </div>
      )}

      {/* Download */}
      {isOperDashboard && (
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
