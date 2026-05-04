"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { PageBreadcrumbs } from "@/components/page-breadcrumbs"
import { useAppStore } from "@/store/app-store"
import { FullscreenLoader } from "@/components/fullscreen-loader"
import { DataInitializer } from "@/components/data-initializer"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const router = useRouter()
  const { currentUser, hasHydrated } = useAppStore((state) => ({
    currentUser: state.currentUser,
    hasHydrated: state.hasHydrated,
  }))

  useEffect(() => {
    if (hasHydrated && !currentUser) {
      router.replace("/login")
    }
  }, [hasHydrated, currentUser, router])

  if (!hasHydrated) {
    return <FullscreenLoader label="Loading workspace..." />
  }

  if (hasHydrated && !currentUser) {
    return <FullscreenLoader label="Redirecting to login..." />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DataInitializer />
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <div className="border-b border-border px-6 py-3">
          <PageBreadcrumbs />
        </div>
        <main className="flex-1 overflow-auto px-6 py-6">{children}</main>
      </div>
    </div>
  )
}
