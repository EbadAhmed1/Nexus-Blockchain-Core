"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/store/app-store"
import { p2pApi, usersApi } from "@/lib/api"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { Users, ShoppingCart, CheckCircle, XCircle } from "lucide-react"

export default function P2PPage() {
  const { currentUser } = useAppStore()
  const [usersWithTokens, setUsersWithTokens] = useState<any[]>([])
  const [selectedToken, setSelectedToken] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [selectedTokenData, setSelectedTokenData] = useState<any>(null)

  const [transactionForm, setTransactionForm] = useState({
    amount: "",
  })

  useEffect(() => {
    if (currentUser) {
      loadUsersWithTokens()
    }
  }, [currentUser])

  const loadUsersWithTokens = async () => {
    setIsLoading(true)
    try {
      const users = await p2pApi.getUsersWithTokens()
      console.log("Loaded users with tokens:", users.length)

      const currentUserId = currentUser?.id
      const filteredUsers = users.filter((u: any) => {
        const userId = u.user_id?.toString()
        const currentId = currentUserId?.toString()

        if (currentId?.includes("user-")) {
          const numericId = currentId.replace("user-", "").replace(/\D/g, '')
          return userId !== numericId
        }
        return userId !== currentId
      })
      
      console.log("Filtered users (excluding current):", filteredUsers.length)
      setUsersWithTokens(filteredUsers)
      
      if (filteredUsers.length === 0 && users.length > 0) {
        toast.info("No other users with tokens found")
      } else if (filteredUsers.length === 0) {
        toast.info("No users with tokens available")
      }
    } catch (error: any) {
      console.error("Failed to load users with tokens:", error)
      const message = error.data?.message || error.message || "Failed to load users"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestTransaction = (user: any, token: any) => {
    if (!currentUser) {
      toast.error("Please login first")
      return
    }
    setSelectedSeller(user)
    setSelectedTokenData(token)
    setShowTransactionModal(true)
    setTransactionForm({ amount: "" })
  }

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !selectedSeller || !selectedTokenData) return

    const amount = parseFloat(transactionForm.amount)
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (amount > selectedTokenData.available_amount) {
      toast.error(`Insufficient balance. Available: ${formatNumber(selectedTokenData.available_amount)}`)
      return
    }

    try {
      const userProfile = await usersApi.getProfile(currentUser.id)
      
      await p2pApi.createTransaction({
        buyerId: userProfile.user_id,
        sellerId: selectedSeller.user_id,
        tokenId: selectedTokenData.token_id,
        amount: amount,
        price: selectedTokenData.selling_price,
      })
      
      toast.success("Transaction request sent! Waiting for seller acceptance.")
      setShowTransactionModal(false)
      loadUsersWithTokens()
    } catch (error: any) {
      const message = error.data?.message || "Failed to create transaction request"
      toast.error(message)
    }
  }

  const allTokens = useMemo(() => {
    const tokenSet = new Set<string>()
    usersWithTokens.forEach((user) => {
      user.tokens.forEach((token: any) => {
        tokenSet.add(token.token_symbol)
      })
    })
    return Array.from(tokenSet).sort()
  }, [usersWithTokens])

  const filteredUsers = useMemo(() => {
    if (selectedToken === "all") return usersWithTokens
    
    return usersWithTokens.map((user) => ({
      ...user,
      tokens: user.tokens.filter((token: any) => token.token_symbol === selectedToken),
    })).filter((user) => user.tokens.length > 0)
  }, [usersWithTokens, selectedToken])

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">P2P Trading</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please login to access P2P trading</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">P2P Trading</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse users and their available tokens. Request a transaction and wait for seller acceptance.
          </p>
        </div>
      </div>

      {/* Filter by Token */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter by Token</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tokens</SelectItem>
              {allTokens.map((tokenSymbol) => (
                <SelectItem key={tokenSymbol} value={tokenSymbol}>
                  {tokenSymbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Users with Tokens */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Users Selling Tokens</CardTitle>
          </div>
          <CardDescription>
            Click "Request Transaction" to buy tokens. The seller will need to accept your request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found with available tokens</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredUsers.map((user) => (
                <Card key={user.user_id} className="border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {user.full_name || user.username}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {user.email}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.email_verified && (
                          <Badge className="bg-success text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        <Badge variant="outline">{user.user_status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Token</TableHead>
                              <TableHead>Available Amount</TableHead>
                              <TableHead>Selling Price</TableHead>
                              <TableHead>Total Value</TableHead>
                              <TableHead>Payment Method</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {user.tokens.map((token: any) => (
                              <TableRow key={token.token_id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{token.token_symbol}</p>
                                    <p className="text-xs text-muted-foreground">{token.token_name}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p className="font-medium">
                                    {formatNumber(token.available_amount)} {token.token_symbol}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <p className="font-semibold text-success">
                                    {formatCurrency(token.selling_price)}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <p className="font-medium">
                                    {formatCurrency(token.available_amount * token.selling_price)}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm">
                                    {token.payment_method || "Any"}
                                  </p>
                                  {token.min_limit && token.max_limit && (
                                    <p className="text-xs text-muted-foreground">
                                      Min: {formatCurrency(token.min_limit)} - Max: {formatCurrency(token.max_limit)}
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    onClick={() => handleRequestTransaction(user, token)}
                                    className="bg-primary hover:bg-primary/90 text-white"
                                  >
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Request Transaction
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Request Modal */}
      {showTransactionModal && selectedSeller && selectedTokenData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Request Transaction</CardTitle>
              <CardDescription>
                Request to buy {selectedTokenData.token_symbol} from {selectedSeller.full_name || selectedSeller.username}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTransaction} className="space-y-4">
                <div className="space-y-2">
                  <Label>Token</Label>
                  <Input
                    value={`${selectedTokenData.token_symbol} - ${selectedTokenData.token_name}`}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price per unit</Label>
                  <Input
                    value={formatCurrency(selectedTokenData.selling_price)}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Available Amount</Label>
                  <Input
                    value={`${formatNumber(selectedTokenData.available_amount)} ${selectedTokenData.token_symbol}`}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount to Buy</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({ amount: e.target.value })}
                    required
                    max={selectedTokenData.available_amount}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max: {formatNumber(selectedTokenData.available_amount)} {selectedTokenData.token_symbol}
                  </p>
                </div>
                {transactionForm.amount && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-semibold">
                        {formatCurrency(parseFloat(transactionForm.amount || "0") * selectedTokenData.selling_price)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowTransactionModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                    Send Request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
