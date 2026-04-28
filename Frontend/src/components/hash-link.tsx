"use client"

import Link from "next/link"
import { CopyButton } from "@/components/copy-button"
import { cn, formatHash } from "@/lib/utils"

interface HashLinkProps {
  hash: string
  href: string
  className?: string
}

export function HashLink({ hash, href, className }: HashLinkProps) {
  return (
    <div className={cn("flex items-center gap-2 font-mono text-xs", className)}>
      <Link href={href} className="text-primary underline-offset-4 hover:underline">
        {formatHash(hash)}
      </Link>
      <CopyButton value={hash} variant="ghost" size="icon" className="h-6 w-6" />
    </div>
  )
}

