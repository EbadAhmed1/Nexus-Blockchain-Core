"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { conversionApi, tokensApi, walletsApi, usersApi } from "@/lib/api"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"
import { toast } from "sonner"
import { ArrowLeftRight, RefreshCw } from "lucide-react"

export default function ConvertPage() {
  const { currentUser } = useAppStore()
  const [tokens, setTokens] = useState<any[]>([])
  const [fromTokenId, setFromTokenId] = useState<string>("")
  const [toTokenId, setToTokenId] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [conversionRate, setConversionRate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [userBalances, setUserBalances] = useState<Record<number, number>>({})

  useEffect(() => {
    loadTokens()
  }, [])

  useEffect(() => {
    if (currentUser && tokens.length > 0) {
      loadUserBalances()
    }
  }, [currentUser, tokens])

  useEffect(() => {
    if (fromTokenId && toTokenId && amount && parseFloat(amount) > 0 && !isNaN(parseInt(fromTokenId)) && !isNaN(parseInt(toTokenId))) {
      loadConversionRate()
    } else {
      setConversionRate(null)
    }
  }, [fromTokenId, toTokenId, amount])

  const loadTokens = async () => {
    try {
      const tokensData = await tokensApi.getAll()
      if (tokensData && Array.isArray(tokensData)) {
        setTokens(tokensData)
      } else {
        setTokens([])
      }
    } catch (error) {
      console.error("Failed to load tokens:", error)
      setTokens([])
    }
  }

  const loadUserBalances = async () => {
    if (!currentUser || tokens.length === 0) return
    
    try {
      const userProfile = await usersApi.getProfile(currentUser.id)
      const wallets = await walletsApi.getAll(userProfile.user_id.toString())
      
      if (wallets && wallets.length > 0) {
        const balances: Record<number, number> = {}
        const primaryWallet = wallets[0]

        try {
          const holdings = await walletsApi.getHoldings(primaryWallet.address)

          holdings.forEach((holding: any) => {
            const tokenId = holding.token_id
            if (tokenId) {
              balances[Number(tokenId)] = parseFloat(holding.amount || 0)
            }
          })

          tokens.forEach((token) => {
            const tokenId = Number(token.id || token.token_id)
            if (!isNaN(tokenId) && balances[tokenId] === undefined) {
              balances[tokenId] = 0
            }
          })
          
          setUserBalances(balances)
        } catch (error) {
          console.error("Failed to load holdings:", error)

          const zeroBalances: Record<number, number> = {}
          tokens.forEach((token) => {
            const tokenId = Number(token.id || token.token_id)
            if (!isNaN(tokenId)) {
              zeroBalances[tokenId] = 0
            }
          })
          setUserBalances(zeroBalances)
        }
      } else {

        const zeroBalances: Record<number, number> = {}
        tokens.forEach((token) => {
          const tokenId = Number(token.id || token.token_id)
          if (!isNaN(tokenId)) {
            zeroBalances[tokenId] = 0
          }
        })
        setUserBalances(zeroBalances)
      }
    } catch (error) {
      console.error("Failed to load balances:", error)
      toast.error("Failed to load wallet balances")
    }
  }

  const loadConversionRate = async () => {
    if (!fromTokenId || !toTokenId || !amount || parseFloat(amount) <= 0) return
    if (isNaN(parseInt(fromTokenId)) || isNaN(parseInt(toTokenId))) return

    setIsLoading(true)
    try {
      const rate = await conversionApi.getRate(
        parseInt(fromTokenId),
        parseInt(toTokenId),
        parseFloat(amount)
      )
      setConversionRate(rate)
    } catch (error: any) {
      console.error("Failed to load conversion rate:", error)
      setConversionRate(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !fromTokenId || !toTokenId || !amount) return
    if (isNaN(parseInt(fromTokenId)) || isNaN(parseInt(toTokenId))) {
      toast.error("Please select valid tokens")
      return
    }

    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0 || isNaN(amountNum)) {
      toast.error("Please enter a valid amount")
      return
    }

    const fromBalance = userBalances[parseInt(fromTokenId)] || 0
    if (amountNum > fromBalance) {
      toast.error(`Insufficient balance. Available: ${formatNumber(fromBalance)}`)
      return
    }

    if (fromTokenId === toTokenId) {
      toast.error("Cannot convert token to itself")
      return
    }

    setIsSwapping(true)
    try {
      const userProfile = await usersApi.getProfile(currentUser.id)
      
      const result = await conversionApi.swap({
        userId: userProfile.user_id,
        fromTokenId: parseInt(fromTokenId),
        toTokenId: parseInt(toTokenId),
        amount: amountNum,
      })

      const fromTokenObj = tokens.find(t => {
        const tokenId = t.id || t.token_id
        return Number(tokenId) === parseInt(fromTokenId)
      })
      const toTokenObj = tokens.find(t => {
        const tokenId = t.id || t.token_id
        return Number(tokenId) === parseInt(toTokenId)
      })
      const fromTokenSymbol = fromTokenObj?.symbol || fromTokenObj?.token_symbol || 'Unknown'
      const toTokenSymbol = toTokenObj?.symbol || toTokenObj?.token_symbol || 'Unknown'
      toast.success(`Successfully converted ${formatNumber(amountNum)} ${fromTokenSymbol} to ${formatNumber(result.amountReceived || result.amount)} ${toTokenSymbol}!`)
      
      setAmount("")
      setConversionRate(null)
      loadUserBalances()
    } catch (error: any) {
      const message = error.data?.message || "Failed to convert tokens"
      toast.error(message)
    } finally {
      setIsSwapping(false)
    }
  }

  const swapTokens = () => {
    const temp = fromTokenId
    setFromTokenId(toTokenId)
    setToTokenId(temp)
    setConversionRate(null)
  }

  const fromToken = fromTokenId ? tokens.find(t => {
    if (!t) return false
    const tokenId = t.id || t.token_id
    if (!tokenId) return false
    const tId = Number(tokenId)
    const fromId = Number(fromTokenId)
    return !isNaN(tId) && !isNaN(fromId) && tId === fromId
  }) : null
  const toToken = toTokenId ? tokens.find(t => {
    if (!t) return false
    const tokenId = t.id || t.token_id
    if (!tokenId) return false
    const tId = Number(tokenId)
    const toId = Number(toTokenId)
    return !isNaN(tId) && !isNaN(toId) && tId === toId
  }) : null
  const fromBalance = fromTokenId && !isNaN(parseInt(fromTokenId)) ? (userBalances[parseInt(fromTokenId)] || 0) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Convert Tokens</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Swap one token for another instantly
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token Conversion</CardTitle>
          <CardDescription>
            Convert between different tokens. 0.3% conversion fee applies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSwap} className="space-y-6">
            {/* From Token */}
            <div className="space-y-2">
              <Label>From Token</Label>
              <Select value={fromTokenId} onValueChange={setFromTokenId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={tokens.length === 0 ? "Loading tokens..." : "Select token to convert from"} />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const filteredTokens = tokens.filter(t => {
                      if (!t) return false
                      const tokenId = t.id || t.token_id
                      if (tokenId === undefined || tokenId === null) return false
                      const numId = Number(tokenId)
                      if (isNaN(numId)) return false
                      if (toTokenId) {
                        const toId = Number(toTokenId)
                        return isNaN(toId) || numId !== toId
                      }
                      return true
                    })
                    
                    if (filteredTokens.length === 0) {
                      return <SelectItem value="none" disabled>No tokens available</SelectItem>
                    }
                    
                    return filteredTokens.map((token) => {
                      const tokenId = token.id || token.token_id
                      const numId = Number(tokenId)
                      if (isNaN(numId)) return null
                      const symbol = token.symbol || token.token_symbol || 'Unknown'
                      const name = token.name || token.token_name || 'Unknown Token'
                      const balanceText = currentUser && userBalances[numId] !== undefined 
                        ? ` (Balance: ${formatNumber(userBalances[numId])})` 
                        : ''
                      return (
                        <SelectItem key={numId} value={String(numId)}>
                          {symbol} - {name}{balanceText}
                        </SelectItem>
                      )
                    }).filter(item => item !== null)
                  })()}
                </SelectContent>
              </Select>
              {fromToken && currentUser && (
                <p className="text-xs text-muted-foreground">
                  Available: {formatNumber(fromBalance)} {fromToken.symbol || fromToken.token_symbol || 'Unknown'}
                </p>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={swapTokens}
                disabled={!fromTokenId || !toTokenId}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <Label>To Token</Label>
              <Select value={toTokenId} onValueChange={setToTokenId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={tokens.length === 0 ? "Loading tokens..." : "Select token to convert to"} />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const filteredTokens = tokens.filter(t => {
                      if (!t) return false
                      const tokenId = t.id || t.token_id
                      if (tokenId === undefined || tokenId === null) return false
                      const numId = Number(tokenId)
                      if (isNaN(numId)) return false
                      if (fromTokenId) {
                        const fromId = Number(fromTokenId)
                        return isNaN(fromId) || numId !== fromId
                      }
                      return true
                    })
                    
                    if (filteredTokens.length === 0) {
                      return <SelectItem value="none" disabled>No tokens available</SelectItem>
                    }
                    
                    return filteredTokens.map((token) => {
                      const tokenId = token.id || token.token_id
                      const numId = Number(tokenId)
                      if (isNaN(numId)) return null
                      const symbol = token.symbol || token.token_symbol || 'Unknown'
                      const name = token.name || token.token_name || 'Unknown Token'
                      return (
                        <SelectItem key={numId} value={String(numId)}>
                          {symbol} - {name}
                        </SelectItem>
                      )
                    }).filter(item => item !== null)
                  })()}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount ({fromToken?.symbol || fromToken?.token_symbol || "Token"})</Label>
              <Input
                type="number"
                step="0.00000001"
                placeholder="0.00000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0.00000001"
              />
              {fromToken && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount((fromBalance * 0.25).toFixed(8))}
                  >
                    25%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount((fromBalance * 0.5).toFixed(8))}
                  >
                    50%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount((fromBalance * 0.75).toFixed(8))}
                  >
                    75%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(fromBalance.toFixed(8))}
                  >
                    Max
                  </Button>
                </div>
              )}
            </div>

            {/* Conversion Rate Preview */}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Calculating conversion rate...</span>
              </div>
            )}

            {conversionRate && !isLoading && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Exchange Rate:</span>
                      <span className="font-medium">
                        1 {fromToken?.symbol || fromToken?.token_symbol || 'Unknown'} = {conversionRate.exchangeRate.toFixed(8)} {toToken?.symbol || toToken?.token_symbol || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">You will receive:</span>
                      <span className="font-semibold text-success">
                        {formatNumber(conversionRate.outputAmount)} {toToken?.symbol || toToken?.token_symbol || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fee ({conversionRate.feePercent}%):</span>
                      <span className="font-medium">
                        {formatNumber(conversionRate.fee)} {toToken?.symbol || toToken?.token_symbol || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">USD Value:</span>
                      <span className="font-semibold">
                        {formatCurrency(conversionRate.usdValue)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!fromTokenId || !toTokenId || !amount || isSwapping || isLoading || !currentUser}
            >
              {isSwapping ? "Converting..." : "Convert"}
            </Button>

            {!currentUser && (
              <p className="text-sm text-muted-foreground text-center">
                Please login to convert tokens
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

