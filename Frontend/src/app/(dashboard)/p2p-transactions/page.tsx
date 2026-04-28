"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppStore } from "@/store/app-store"
import { p2pApi, usersApi } from "@/lib/api"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils"
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"

export default function P2PTransactionsPage() {
  const { currentUser } = useAppStore()
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTx, setSelectedTx] = useState<any | null>(null)
  const [paymentProof, setPaymentProof] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed">("all")

  useEffect(() => {
    if (currentUser) {
      loadTransactions()
    }
  }, [currentUser, activeTab])

  const loadTransactions = async () => {
    if (!currentUser) return
    setIsLoading(true)
    try {
      const userProfile = await usersApi.getProfile(currentUser.id)
      const params: any = {
        userId: userProfile.user_id,
        limit: 100,
      }
      if (activeTab !== "all") {
        params.status = activeTab
      }
      const txList = await p2pApi.getTransactions(params)
      setTransactions(txList)
    } catch (error) {
      console.error("Failed to load transactions:", error)
      toast.error("Failed to load P2P transactions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (txId: string, status: string) => {
    if (!currentUser) return

    try {
      const userProfile = await usersApi.getProfile(currentUser.id)
      await p2pApi.updateTransactionStatus(txId, {
        status,
        paymentProof: paymentProof || undefined,
        userId: userProfile.user_id,
      })
      toast.success("Transaction status updated")
      setSelectedTx(null)
      setPaymentProof("")
      loadTransactions()
    } catch (error: any) {
      const message = error.data?.message || "Failed to update transaction"
      toast.error(message)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-success" />
      case "pending":
      case "paid":
        return <Clock className="h-4 w-4 text-warning" />
      case "cancelled":
      case "disputed":
        return <XCircle className="h-4 w-4 text-error" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === "all") return true
    return tx.status === activeTab
  })

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">P2P Transactions</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please login to view P2P transactions</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">P2P Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your P2P buy and sell transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My P2P Transactions</CardTitle>
          <CardDescription>Track and manage your P2P orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Counterparty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          Loading transactions...
                        </TableCell>
                      </TableRow>
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const userProfile = currentUser
                        const isBuyer = tx.buyer_id === parseInt(userProfile?.id || "0")
                        const isSeller = tx.seller_id === parseInt(userProfile?.id || "0")
                        const canUpdate = (tx.status === "pending" || tx.status === "paid") && (isBuyer || isSeller)

                        return (
                          <TableRow key={tx.p2p_tx_id}>
                            <TableCell>
                              <p className="text-xs font-mono text-muted-foreground">#{tx.p2p_tx_id}</p>
                            </TableCell>
                            <TableCell>
                              <p className="font-semibold">{tx.token_symbol}</p>
                            </TableCell>
                            <TableCell>
                              <p>{formatNumber(parseFloat(tx.amount))}</p>
                            </TableCell>
                            <TableCell>
                              <p>{formatCurrency(parseFloat(tx.price))}</p>
                            </TableCell>
                            <TableCell>
                              <p className="font-semibold">{formatCurrency(parseFloat(tx.total))}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant={isBuyer ? "default" : "outline"}>
                                {isBuyer ? "Buyer" : "Seller"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{isBuyer ? tx.seller_username : tx.buyer_username}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(tx.status)}
                                <Badge className={tx.status === "completed" ? "bg-success" : ""}>
                                  {tx.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {canUpdate && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedTx(tx)}
                                >
                                  Manage
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedTx && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Transaction #{selectedTx.p2p_tx_id}</CardTitle>
            <CardDescription>Update transaction status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Token</p>
                <p className="font-semibold">{selectedTx.token_symbol}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-semibold">{formatNumber(parseFloat(selectedTx.amount))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-semibold">{formatCurrency(parseFloat(selectedTx.price))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-semibold">{formatCurrency(parseFloat(selectedTx.total))}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Proof (Optional)</Label>
              <Input
                placeholder="Transaction ID, receipt number, etc."
                value={paymentProof}
                onChange={(e) => setPaymentProof(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              {selectedTx.status === "pending" && (
                <Button
                  onClick={() => handleUpdateStatus(selectedTx.p2p_tx_id.toString(), "paid")}
                  className="bg-warning hover:bg-warning/90"
                >
                  Mark as Paid
                </Button>
              )}
              {selectedTx.status === "paid" && (
                <Button
                  onClick={() => handleUpdateStatus(selectedTx.p2p_tx_id.toString(), "completed")}
                  className="bg-success hover:bg-success/90"
                >
                  Complete Transaction
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus(selectedTx.p2p_tx_id.toString(), "cancelled")}
                className="border-error text-error hover:bg-error/10"
              >
                Cancel
              </Button>
              <Button variant="outline" onClick={() => setSelectedTx(null)}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

