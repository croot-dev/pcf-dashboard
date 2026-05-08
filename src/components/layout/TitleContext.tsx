"use client"

import { createContext, useContext, useState } from "react"

export interface PageTitle {
  ko: string
  en: string
  product?: string
}

const DEFAULT_PAGE_TITLE: PageTitle = {
  ko: "",
  en: "",
}

export const PageTitleContext = createContext<PageTitle>(DEFAULT_PAGE_TITLE)
export const PageTitleDispatchContext = createContext<(title: PageTitle) => void>(() => {})

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<PageTitle>(DEFAULT_PAGE_TITLE)

  return (
    <PageTitleDispatchContext.Provider value={setTitle}>
      <PageTitleContext.Provider value={title}>
        {children}
      </PageTitleContext.Provider>
    </PageTitleDispatchContext.Provider>
  )
}

export function usePageTitle() {
  return useContext(PageTitleContext)
}

export function useSetPageTitle() {
  return useContext(PageTitleDispatchContext)
}
