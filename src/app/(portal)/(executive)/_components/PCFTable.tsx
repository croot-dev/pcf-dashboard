import React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { SCOPES, SCOPE_COLOR, SCOPE_LABEL, type PCFTableRow } from "@/lib/dashboard/types"

interface Props {
  rows: PCFTableRow[]
}

const TH: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: ".06em",
  textTransform: "uppercase",
  color: "var(--fg-3)",
  padding: "7px 14px",
  fontWeight: 500,
  whiteSpace: "nowrap",
  borderBottom: "1px solid var(--border)",
}

const TD: React.CSSProperties = {
  padding: "8px 14px",
  fontSize: 12,
  borderBottom: "1px solid var(--border)",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
}

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontVariantNumeric: "tabular-nums",
}

export function PCFTable({ rows }: Props) {
  const grouped = SCOPES
    .map((scope) => ({ scope, items: rows.filter((r) => r.scope === scope) }))
    .filter((g) => g.items.length > 0)

  return (
    <Card className="flex-1 gap-0 py-0">
      <CardHeader className="border-b px-5 py-3">
        <CardTitle className="text-[13px] font-semibold">배출원 별 PCF 상세</CardTitle>
        <CardDescription className="text-[11px]">단위 PCF = 총 배출량을 생산량으로 나눈 제품 1단위 기준 배출량</CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-subtle)" }}>
              <th style={{ ...TH, textAlign: "left" }}>활동유형</th>
              <th style={{ ...TH, textAlign: "left" }}>배출원</th>
              <th style={{ ...TH, textAlign: "right" }}>생산량</th>
              <th style={{ ...TH, textAlign: "right" }}>배출계수</th>
              <th style={{ ...TH, textAlign: "right" }}>총 배출량</th>
              <th style={{ ...TH, textAlign: "right" }}>단위 PCF</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ scope, items }) => (
              <React.Fragment key={scope}>
                <tr style={{ background: "var(--bg-subtle)" }}>
                  <td
                    colSpan={6}
                    style={{
                      padding: "5px 14px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      color: SCOPE_COLOR[scope],
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {SCOPE_LABEL[scope]}
                  </td>
                </tr>
                {items.map((row, i) => (
                  <tr key={`${scope}-${i}`}>
                    <td style={{ ...TD, fontWeight: 500 }}>{row.activityType}</td>
                    <td style={{ ...TD, color: "var(--fg-2)" }}>{row.sourceName}</td>
                    <td style={{ ...TD, ...MONO, textAlign: "right" }}>
                      {row.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      <span style={{ color: "var(--fg-3)", fontSize: 10, marginLeft: 3 }}>{row.unit}</span>
                    </td>
                    <td style={{ ...TD, ...MONO, textAlign: "right" }}>
                      {row.factor}
                      <span style={{ color: "var(--fg-3)", fontSize: 10, marginLeft: 3 }}>
                        kgCO₂e/{row.factorUnit}
                      </span>
                    </td>
                    <td style={{ ...TD, ...MONO, textAlign: "right", fontWeight: 600 }}>
                      {row.co2e.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      <span style={{ color: "var(--fg-3)", fontSize: 10, marginLeft: 3 }}>kgCO₂e</span>
                    </td>
                    <td style={{ ...TD, ...MONO, textAlign: "right", fontWeight: 600, color: "var(--hl-blue, #0ea5e9)" }}>
                      {row.co2ePerUnit.toFixed(3)}
                      <span style={{ color: "var(--fg-3)", fontSize: 10, marginLeft: 3 }}>kgCO₂e/unit</span>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
