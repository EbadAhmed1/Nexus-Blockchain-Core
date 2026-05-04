"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { marketApi } from "@/lib/api"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type MarketDetailPageProps = {
  params: { symbol: string }
}

export default function MarketDetailPage({ params }: MarketDetailPageProps) {
  const { symbol } = useParams()
  const [pair, setPair] = useState<any>(null)
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [orderBook, setOrderBook] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (symbol) {
      loadMarketDetails()
    }
  }, [symbol])

  const loadMarketDetails = async () => {
    setIsLoading(true)
    try {
      const [pairData, historyData, orderBookData] = await Promise.all([
        marketApi.getPairDetails(symbol as string),
        marketApi.getPriceHistory(symbol as string, "1h", 24),
        marketApi.getOrderBook(symbol as string),
      ])
      setPair(pairData)
      setPriceHistory(historyData)
      setOrderBook(orderBookData)
    } catch (error) {
      console.error("Failed to load market details:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center text-muted-foreground py-12">Loading market data...</div>
      </div>
    )
  }

  if (!pair) {
    return (
      <div className="space-y-6">
        <div className="text-center text-muted-foreground py-12">Trading pair not found</div>
      </div>
    )
  }

  const change = parseFloat(pair.change_24h) || 0
  const isPositive = change >= 0

  const chartData = priceHistory.map((h) => ({
    time: new Date(h.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    price: parseFloat(h.price),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{pair.token_symbol}/USD</h1>
        <p className="text-sm text-muted-foreground mt-1">{pair.token_name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Price</div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(parseFloat(pair.price_usd) || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">24h Change</div>
            <div className={`text-2xl font-bold flex items-center gap-2 ${isPositive ? "text-success" : "text-error"}`}>
              {isPositive ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
              {change.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">24h Volume</div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(parseFloat(pair.volume_24h) || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Market Cap</div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(parseFloat(pair.market_cap_usd) || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Price Chart</CardTitle>
            <CardDescription>24 hour price history</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                <XAxis dataKey="time" stroke="#848E9C" />
                <YAxis stroke="#848E9C" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#181A20", border: "1px solid #2B3139", borderRadius: "8px" }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? "#0ECB81" : "#F6465D"}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Book</CardTitle>
            <CardDescription>Live buy/sell orders</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="buy" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy" className="data-[state=active]:bg-success">
                  Buy
                </TabsTrigger>
                <TabsTrigger value="sell" className="data-[state=active]:bg-error">
                  Sell
                </TabsTrigger>
              </TabsList>
              <TabsContent value="buy" className="space-y-2 mt-4">
                <div className="text-xs text-muted-foreground mb-2">Price (USD) | Amount</div>
                {orderBook?.buys?.slice(0, 10).map((order: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b border-[#2B3139]">
                    <span className="text-success">{formatCurrency(parseFloat(order.price))}</span>
                    <span>{formatNumber(parseFloat(order.amount))}</span>
                  </div>
                )) || <div className="text-sm text-muted-foreground">No buy orders</div>}
              </TabsContent>
              <TabsContent value="sell" className="space-y-2 mt-4">
                <div className="text-xs text-muted-foreground mb-2">Price (USD) | Amount</div>
                {orderBook?.sells?.slice(0, 10).map((order: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b border-[#2B3139]">
                    <span className="text-error">{formatCurrency(parseFloat(order.price))}</span>
                    <span>{formatNumber(parseFloat(order.amount))}</span>
                  </div>
                )) || <div className="text-sm text-muted-foreground">No sell orders</div>}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Supply</div>
              <div className="text-lg font-semibold">{formatNumber(parseFloat(pair.total_supply) || 0)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Holders</div>
              <div className="text-lg font-semibold">{formatNumber(pair.holders_count || 0)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">24h Transactions</div>
              <div className="text-lg font-semibold">{formatNumber(pair.transactions_24h || 0)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Decimals</div>
              <div className="text-lg font-semibold">{pair.decimals || 18}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

