"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppStore } from "@/store/app-store"
import { walletsApi, tokensApi, walletManagementApi } from "@/lib/api"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { CopyButton } from "@/components/copy-button"
import { ArrowDown, ArrowUp, ArrowRightLeft, Wallet } from "lucide-react"

export default function WalletManagementPage() {
  const { currentUser } = useAppStore()
  const [wallets, setWallets] = useState<any[]>([])
  const [tokens, setTokens] = useState<any[]>([])
  const [selectedWallet, setSelectedWallet] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "transfer">("deposit")
  const [isLoading, setIsLoading] = useState(false)

  const [depositForm, setDepositForm] = useState({ tokenId: "", amount: "" })
  const [withdrawForm, setWithdrawForm] = useState({ tokenId: "", amount: "", toAddress: "" })
  const [transferForm, setTransferForm] = useState({ tokenId: "", amount: "", toAddress: "" })

  useEffect(() => {
    if (currentUser) {
      loadData()
    }
  }, [currentUser])

  const loadData = async () => {
    if (!currentUser) return
    setIsLoading(true)
    try {
      const [walletsData, tokensData] = await Promise.all([
        walletsApi.getAll(currentUser.id),
        tokensApi.getAll(),
      ])
      setWallets(walletsData)
      setTokens(tokensData)
      if (walletsData.length > 0 && !selectedWallet) {
        setSelectedWallet(walletsData[0].address)
      }
    } catch (error) {
      console.error("Failed to load data:", error)
      toast.error("Failed to load wallet data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWallet || !depositForm.tokenId || !depositForm.amount) {
      toast.error("Please fill all fields")
      return
    }

    try {
      await walletManagementApi.deposit(
        selectedWallet,
        parseInt(depositForm.tokenId),
        parseFloat(depositForm.amount)
      )
      toast.success("Deposit successful")
      setDepositForm({ tokenId: "", amount: "" })
      loadData()
    } catch (error: any) {
      toast.error(error.data?.message || "Deposit failed")
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWallet || !withdrawForm.tokenId || !withdrawForm.amount) {
      toast.error("Please fill all fields")
      return
    }

    try {
      await walletManagementApi.withdraw(
        selectedWallet,
        parseInt(withdrawForm.tokenId),
        parseFloat(withdrawForm.amount),
        withdrawForm.toAddress || undefined
      )
      toast.success("Withdrawal successful")
      setWithdrawForm({ tokenId: "", amount: "", toAddress: "" })
      loadData()
    } catch (error: any) {
      toast.error(error.data?.message || "Withdrawal failed")
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWallet || !transferForm.tokenId || !transferForm.amount || !transferForm.toAddress) {
      toast.error("Please fill all fields")
      return
    }

    try {
      const result = await walletManagementApi.transfer(
        selectedWallet,
        transferForm.toAddress,
        parseInt(transferForm.tokenId),
        parseFloat(transferForm.amount)
      )
      toast.success(`Transfer successful! TX: ${result.transactionHash.slice(0, 10)}...`)
      setTransferForm({ tokenId: "", amount: "", toAddress: "" })
      loadData()
    } catch (error: any) {
      toast.error(error.data?.message || "Transfer failed")
    }
  }

  const selectedWalletData = wallets.find((w) => w.address === selectedWallet)
  const [balances, setBalances] = useState<any[]>([])

  useEffect(() => {
    if (selectedWallet) {
      walletsApi.getBalance(selectedWallet).then(setBalances).catch(console.error)
    }
  }, [selectedWallet])

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Wallet Management</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please login to manage your wallets</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Wallet Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Deposit, withdraw, and transfer tokens</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>My Wallets</CardTitle>
            <CardDescription>Select a wallet to manage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wallets.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No wallets found</div>
              ) : (
                wallets.map((wallet) => (
                  <Card
                    key={wallet.id}
                    className={`cursor-pointer transition-all ${
                      selectedWallet === wallet.address ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setSelectedWallet(wallet.address)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{wallet.label}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs font-mono text-muted-foreground">{wallet.address}</p>
                            <CopyButton value={wallet.address} variant="ghost" size="icon" className="h-4 w-4" />
                          </div>
                        </div>
                        <Wallet className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
            <CardDescription>Current holdings</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedWalletData ? (
              <div className="space-y-3">
                {balances.length > 0 ? (
                  balances.map((balance) => (
                    <div key={balance.token_id} className="flex justify-between items-center py-2 border-b border-[#2B3139]">
                      <div>
                        <p className="font-medium text-sm">{balance.token_symbol}</p>
                        <p className="text-xs text-muted-foreground">{balance.token_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatNumber(parseFloat(balance.amount))}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(parseFloat(balance.amount) * (parseFloat(balance.price_usd) || 0))}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">No balance</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">Select a wallet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedWalletData && (
        <Card>
          <CardHeader>
            <CardTitle>Wallet Operations</CardTitle>
            <CardDescription>Deposit, withdraw, or transfer tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="deposit">
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Deposit
                </TabsTrigger>
                <TabsTrigger value="withdraw">
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Withdraw
                </TabsTrigger>
                <TabsTrigger value="transfer">
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transfer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="deposit" className="mt-6">
                <form onSubmit={handleDeposit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Token</Label>
                    <Select
                      value={depositForm.tokenId}
                      onValueChange={(value) => setDepositForm({ ...depositForm, tokenId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        {tokens.map((token) => (
                          <SelectItem key={token.id} value={token.id}>
                            {token.symbol} - {token.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      value={depositForm.amount}
                      onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="p-4 bg-[#1E2329] rounded-lg border border-[#2B3139]">
                    <p className="text-xs text-muted-foreground mb-1">Deposit to:</p>
                    <p className="text-sm font-mono">{selectedWallet}</p>
                  </div>
                  <Button type="submit" className="w-full bg-success hover:bg-success/90">
                    Deposit
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="withdraw" className="mt-6">
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Token</Label>
                    <Select
                      value={withdrawForm.tokenId}
                      onValueChange={(value) => setWithdrawForm({ ...withdrawForm, tokenId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        {tokens.map((token) => (
                          <SelectItem key={token.id} value={token.id}>
                            {token.symbol} - {token.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      value={withdrawForm.amount}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To Address (Optional)</Label>
                    <Input
                      placeholder="0x..."
                      value={withdrawForm.toAddress}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, toAddress: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-error hover:bg-error/90">
                    Withdraw
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="transfer" className="mt-6">
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Token</Label>
                    <Select
                      value={transferForm.tokenId}
                      onValueChange={(value) => setTransferForm({ ...transferForm, tokenId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        {tokens.map((token) => (
                          <SelectItem key={token.id} value={token.id}>
                            {token.symbol} - {token.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>To Address</Label>
                    <Input
                      placeholder="0x..."
                      value={transferForm.toAddress}
                      onChange={(e) => setTransferForm({ ...transferForm, toAddress: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    Transfer
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
