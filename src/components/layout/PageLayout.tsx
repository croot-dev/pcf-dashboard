"use client"

import { useEffect } from "react"
import { type PageTitle, useSetPageTitle } from "./TitleContext"

interface Props {
  title: PageTitle
  children: React.ReactNode
}

export function PageLayout({ title, children }: Props) {
  const setPageTitle = useSetPageTitle()

  useEffect(() => {
    setPageTitle(title)
  }, [setPageTitle, title])

  return children
}
