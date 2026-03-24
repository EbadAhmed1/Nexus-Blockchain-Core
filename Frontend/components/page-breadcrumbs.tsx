"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const hiddenRoutes = new Set(["/login", "/register", "/"])

const formatSegment = (segment: string) => segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())

export function PageBreadcrumbs() {
  const pathname = usePathname()

  if (!pathname || hiddenRoutes.has(pathname)) {
    return null
  }

  const segments = pathname.split("/").filter(Boolean)

  return (
    <Breadcrumb className="text-sm text-muted-foreground">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`
          const label = formatSegment(segment)
          const isLast = index === segments.length - 1
          return (
            <div key={href} className="flex items-center">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

