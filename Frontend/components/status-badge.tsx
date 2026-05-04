"use client"

import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  suspended: "bg-amber-500/15 text-amber-400",
  away: "bg-amber-500/15 text-amber-400",
  pending: "bg-amber-500/15 text-amber-400",
  finalized: "bg-emerald-500/15 text-emerald-400",
  confirmed: "bg-emerald-500/15 text-emerald-400",
  failed: "bg-rose-500/15 text-rose-400",
  jailed: "bg-rose-500/15 text-rose-400",
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize",
        statusColors[status.toLowerCase()] ?? "bg-muted text-foreground",
      )}
    >
      {status}
    </span>
  )
}

