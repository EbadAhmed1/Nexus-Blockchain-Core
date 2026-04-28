"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ButtonProps } from "@/components/ui/button"

interface CopyButtonProps extends ButtonProps {
  value: string
  copiedLabel?: string
}

export function CopyButton({ value, copiedLabel = "Copied", ...props }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  return (
    <Button
      variant="outline"
      size="sm"
      {...props}
      onClick={async (event) => {
        props.onClick?.(event)
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        } catch (error) {
          console.error("Clipboard error", error)
        }
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="sr-only">{copied ? copiedLabel : "Copy"}</span>
    </Button>
  )
}

