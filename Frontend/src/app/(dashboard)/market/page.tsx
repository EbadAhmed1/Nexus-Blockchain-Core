"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { marketApi, tokensApi } from "@/lib/api"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { TrendingUp, TrendingDown, Search, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useAppStore } from "@/store/app-store"

export default function MarketPage() {
  const { currentUser } = useAppStore()
  const [pairs, setPairs] = useState<any[]>([])
  const [tokens, setTokens] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"market_cap" | "volume" | "change">("market_cap")

  useEffect(() => {
    loadMarketData()
  }, [])

  const loadMarketData = async () => {
    setIsLoading(true)
    try {
      const [pairsData, tokensData] = await Promise.all([
        marketApi.getTradingPairs(),
        tokensApi.getAll(),
      ])
      setPairs(pairsData)
      setTokens(tokensData)
    } catch (error) {
      console.error("Failed to load market data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPairs = pairs.filter((pair) => {
    if (searchQuery) {
      return (
        pair.token_symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pair.token_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return true
  })

  const sortedPairs = [...filteredPairs].sort((a, b) => {
    switch (sortBy) {
      case "market_cap":
        return (parseFloat(b.market_cap_usd) || 0) - (parseFloat(a.market_cap_usd) || 0)
      case "volume":
        return (parseFloat(b.volume_24h) || 0) - (parseFloat(a.volume_24h) || 0)
      case "change":
        return (parseFloat(b.change_24h) || 0) - (parseFloat(a.change_24h) || 0)
      default:
        return 0
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Market</h1>
        <p className="text-sm text-muted-foreground mt-1">View all trading pairs and prices</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total Market Cap</div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(
                pairs.reduce((sum, p) => sum + (parseFloat(p.market_cap_usd) || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">24h Volume</div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(
                pairs.reduce((sum, p) => sum + (parseFloat(p.volume_24h) || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total Pairs</div>
            <div className="text-2xl font-bold text-foreground">{pairs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Active Tokens</div>
            <div className="text-2xl font-bold text-foreground">{tokens.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trading Pairs</CardTitle>
              <CardDescription>All available trading pairs</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market_cap">Market Cap</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="change">24h Change</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pair</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>24h Change</TableHead>
                  <TableHead>24h Volume</TableHead>
                  <TableHead>Market Cap</TableHead>
                  <TableHead>Holders</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Loading market data...
                    </TableCell>
                  </TableRow>
                ) : sortedPairs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No trading pairs found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedPairs.map((pair) => {
                    const change = parseFloat(pair.change_24h) || 0
                    const isPositive = change >= 0
                    return (
                      <TableRow key={pair.token_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pair.token_symbol}/USD</p>
                            <p className="text-xs text-muted-foreground">{pair.token_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold">{formatCurrency(parseFloat(pair.price_usd) || 0)}</p>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 ${isPositive ? "text-success" : "text-error"}`}>
                            {isPositive ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="font-medium">{change.toFixed(2)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p>{formatCurrency(parseFloat(pair.volume_24h) || 0)}</p>
                        </TableCell>
                        <TableCell>
                          <p>{formatCurrency(parseFloat(pair.market_cap_usd) || 0)}</p>
                        </TableCell>
                        <TableCell>
                          <p>{formatNumber(pair.holders_count || 0)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/market/${pair.token_symbol}`}>
                              <Button variant="outline" size="sm">View</Button>
                            </Link>
                            {currentUser && pair.token_symbol !== "USDT" && (
                              <Button 
                                variant="default" 
                                size="sm"
                                disabled
                                title="Coming soon"
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Buy (Coming Soon)
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
