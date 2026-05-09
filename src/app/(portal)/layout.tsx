import type { Metadata } from "next"
import { Suspense } from "react"
import "@/styles/globals.css"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { PageTitleProvider } from "@/components/layout/TitleContext"
import { TopBar } from "@/components/layout/TopBar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "PCF Dashboard · Hana.eco",
  description: "Product Carbon Footprint Executive Dashboard",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, overflow: "hidden", background: "var(--bg-subtle)" }}>
        <PageTitleProvider>
          <TooltipProvider>
            <SidebarProvider
              style={{
                "--sidebar-width": "240px",
                "--sidebar-width-icon": "64px",
                height: "100svh",
                overflow: "hidden",
              } as React.CSSProperties}
            >
              <AppSidebar />
              <SidebarInset style={{ overflow: "hidden" }}>
                <Suspense
                  fallback={<div style={{ height: 56, borderBottom: "1px solid var(--border)" }} />}
                >
                  <TopBar />
                </Suspense>
                <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
              <Toaster richColors position="bottom-right" />
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </PageTitleProvider>
      </body>
    </html>
  )
}
