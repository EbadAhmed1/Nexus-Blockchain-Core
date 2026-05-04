"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppStore } from "@/store/app-store"
import { walletsApi } from "@/lib/api"

export function SendTransactionForm() {
  const { wallets, tokens, sendTransaction, currentUser } = useAppStore()
  const [fromAddress, setFromAddress] = useState("")
  const [toAddress, setToAddress] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)

  const userWallets = wallets.filter((w) => w.userId === currentUser?.id)

  useEffect(() => {
    if (fromAddress && tokenSymbol) {
      const fetchBalance = async () => {
        try {
          const balances = await walletsApi.getBalance(fromAddress, tokenSymbol)
          const tokenBalance = balances.find((b: any) => b.token_symbol === tokenSymbol)
          setBalance(tokenBalance ? parseFloat(tokenBalance.amount) : 0)
        } catch (error) {
          setBalance(null)
        }
      }
      fetchBalance()
    } else {
      setBalance(null)
    }
  }, [fromAddress, tokenSymbol])

  const handleFromAddressChange = (address: string) => {
    setFromAddress(address)
  }

  const handleTokenChange = (symbol: string) => {
    setTokenSymbol(symbol)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fromAddress || !toAddress || !tokenSymbol || !amount) {
      toast.error("Please fill all fields")
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Invalid amount")
      return
    }

    if (balance !== null && amountNum > balance) {
      toast.error("Insufficient balance")
      return
    }

    setIsLoading(true)
    try {
      await sendTransaction({
        fromAddress,
        toAddress,
        tokenSymbol,
        amount: amountNum,
        method: "p2p",
      })

      setFromAddress("")
      setToAddress("")
      setTokenSymbol("")
      setAmount("")
      setBalance(null)
    } catch (error) {

    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Transaction</CardTitle>
        <CardDescription>Transfer tokens between wallets</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from-address">From Wallet</Label>
            <Select value={fromAddress} onValueChange={handleFromAddressChange}>
              <SelectTrigger id="from-address">
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                {userWallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.address}>
                    {wallet.label} ({wallet.address.slice(0, 8)}...)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {balance !== null && (
              <p className="text-sm text-muted-foreground">
                Balance: {balance.toFixed(4)} {tokenSymbol}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-address">To Address</Label>
            <Input
              id="to-address"
              placeholder="0x..."
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <Select value={tokenSymbol} onValueChange={handleTokenChange}>
              <SelectTrigger id="token">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.id} value={token.symbol}>
                    {token.symbol} - {token.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.0001"
              placeholder="0.0000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Sending..." : "Send Transaction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

