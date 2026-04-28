"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { transactionsApi } from "@/lib/api"
import { formatCurrency, formatDate, formatHash } from "@/lib/utils"
import { HashLink } from "@/components/hash-link"
import { CopyButton } from "@/components/copy-button"
import { ArrowRight, CheckCircle, Clock, XCircle } from "lucide-react"

export default function TransactionDetailPage() {
  const params = useParams()
  const [transaction, setTransaction] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadTransaction()
    }
  }, [params.id])

  const loadTransaction = async () => {
    setIsLoading(true)
    try {
      const tx = await transactionsApi.getByHash(params.id as string)
      setTransaction(tx)
    } catch (error) {
      console.error("Failed to load transaction:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center text-muted-foreground py-12">Loading transaction...</div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="space-y-6">
        <div className="text-center text-muted-foreground py-12">Transaction not found</div>
      </div>
    )
  }

  const getStatusIcon = () => {
    switch (transaction.status) {
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-success" />
      case "pending":
        return <Clock className="h-5 w-5 text-warning" />
      case "failed":
        return <XCircle className="h-5 w-5 text-error" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Transaction Details</h1>
        <p className="text-sm text-muted-foreground mt-1">View complete transaction information</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction Information</CardTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge
                variant={transaction.status === "confirmed" ? "default" : "outline"}
                className={
                  transaction.status === "confirmed"
                    ? "bg-success text-white"
                    : transaction.status === "failed"
                    ? "bg-error text-white"
                    : ""
                }
              >
                {transaction.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm">{formatHash(transaction.hash, 12)}</p>
                  <CopyButton value={transaction.hash} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Method</p>
                <p className="font-medium">{transaction.method || "transfer"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Timestamp</p>
                <p className="font-medium">{formatDate(transaction.timestamp)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Amount</p>
                <p className="text-2xl font-bold text-foreground">{transaction.amount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fee</p>
                <p className="font-medium">{formatCurrency(transaction.fee)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Block</p>
                <p className="font-medium">{transaction.blockId || "Pending"}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#2B3139] pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">From</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm">{transaction.fromWalletId || "N/A"}</p>
                  {transaction.fromWalletId && <CopyButton value={transaction.fromWalletId} />}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground mx-4" />
              <div className="flex-1 text-right">
                <p className="text-sm text-muted-foreground mb-1">To</p>
                <div className="flex items-center justify-end gap-2">
                  <p className="font-mono text-sm">{transaction.toWalletId || "N/A"}</p>
                  {transaction.toWalletId && <CopyButton value={transaction.toWalletId} />}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
