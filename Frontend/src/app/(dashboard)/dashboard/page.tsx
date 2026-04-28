"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AnalyticsCard } from "@/components/analytics-card"
import { TransactionChart } from "@/components/transaction-chart"
import { TokenDistributionChart } from "@/components/token-distribution-chart"
import { ChartCard } from "@/components/chart-card"
import { PageHeader } from "@/components/page-header"
import { HashLink } from "@/components/hash-link"
import { StatusBadge } from "@/components/status-badge"
import { useAppStore } from "@/store/app-store"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils"

type AppState = ReturnType<typeof useAppStore>

export default function DashboardPage() {
  const { wallets, tokens, transactions, currentUser } = useAppStore((state) => ({
    wallets: state.wallets,
    tokens: state.tokens,
    transactions: state.transactions,
    currentUser: state.currentUser,
  }))

  const tokensById = useMemo(
    () =>
      tokens.reduce<Record<string, (typeof tokens)[number]>>((acc, token) => {
        acc[token.id] = token
        return acc
      }, {}),
    [tokens],
  )

  const userWallets = useMemo(() => {
    if (!currentUser) return []
    return wallets.filter((wallet) => wallet.userId === currentUser.id)
  }, [wallets, currentUser])

  const walletIds = useMemo(() => new Set(userWallets.map((wallet) => wallet.id)), [userWallets])

  const userTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) => walletIds.has(transaction.fromWalletId) || walletIds.has(transaction.toWalletId),
      ),
    [transactions, walletIds],
  )

  const tokenHoldings = useMemo(() => {
    const holdingsMap = new Map<string, TokenHoldingWithMeta>()

    userWallets.forEach((wallet) => {
      wallet.tokenHoldings.forEach((holding) => {
        const token = tokensById[holding.tokenId]
        if (!token) return
        const existing = holdingsMap.get(holding.tokenId) ?? {
          tokenId: holding.tokenId,
          amount: 0,
          value: 0,
          token,
        }
        existing.amount += holding.amount
        existing.value += holding.amount * token.priceUsd
        holdingsMap.set(holding.tokenId, existing)
      })
    })

    return Array.from(holdingsMap.values())
  }, [tokensById, userWallets])

  const portfolioValue = tokenHoldings.reduce((sum, holding) => sum + holding.value, 0)

  const stats = [
    { label: "Wallets", value: formatNumber(userWallets.length), changeLabel: "Active" },
    { label: "Total transfers", value: formatNumber(userTransactions.length), changeLabel: "All time" },
    { label: "Tokens held", value: formatNumber(tokenHoldings.length), changeLabel: "Unique assets" },
    { label: "Portfolio value", value: formatCurrency(portfolioValue), changeLabel: "Across wallets" },
  ]

  const transactionActivity = useMemo(() => buildWeeklySeries(userTransactions), [userTransactions])
  const tokenDistribution = useMemo(() => buildTokenDistribution(tokenHoldings), [tokenHoldings])
  const recentTransactions = userTransactions.slice(0, 5)

  const walletSummaries = useMemo(() => {
    return userWallets.map((wallet) => {
      const balance = wallet.tokenHoldings.reduce((sum, holding) => {
        const token = tokensById[holding.tokenId]
        return token ? sum + holding.amount * token.priceUsd : sum
      }, 0)

      const lastActivityTimestamps = userTransactions
        .filter((transaction) => transaction.fromWalletId === wallet.id || transaction.toWalletId === wallet.id)
        .map((transaction) => new Date(transaction.timestamp).getTime())

      const lastActivity =
        lastActivityTimestamps.length > 0 ? Math.max(...lastActivityTimestamps) : new Date(wallet.createdAt).getTime()

      return { wallet, balance, lastActivity }
    })
  }, [tokensById, userTransactions, userWallets])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Wallets, balances, and transfers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#181A20] border border-[#2B3139] rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
            <div className="text-xl font-semibold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.changeLabel}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ChartCard title="Transfers (7d)" description="User-only transfers grouped by day">
            <TransactionChart data={transactionActivity} />
          </ChartCard>
        </div>
        <ChartCard title="Token distribution" description="Share of your holdings by USD value">
          <TokenDistributionChart data={tokenDistribution} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>Your latest confirmed transfers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hash</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => {
                  const token = tokensById[transaction.tokenId]
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <HashLink hash={transaction.hash} href={`/transactions/${transaction.id}`} />
                      </TableCell>
                      <TableCell>{token?.symbol ?? transaction.tokenId}</TableCell>
                      <TableCell>{transaction.amount}</TableCell>
                      <TableCell>
                        <StatusBadge status={transaction.status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
                {recentTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Link href="/transactions" className="text-sm text-primary underline-offset-4 hover:underline">
              Review my transactions →
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Wallet summary</CardTitle>
            <CardDescription>Balance and recent activity per wallet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walletSummaries.map(({ wallet, balance, lastActivity }) => (
                  <TableRow key={wallet.id}>
                    <TableCell>
                      <Link href={`/wallets/${wallet.id}`} className="font-medium hover:underline">
                        {wallet.label}
                      </Link>
                    </TableCell>
                    <TableCell>{formatCurrency(balance)}</TableCell>
                    <TableCell>{formatDate(lastActivity)}</TableCell>
                  </TableRow>
                ))}
                {walletSummaries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No wallets found for your account.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Link href="/wallets" className="text-sm text-primary underline-offset-4 hover:underline">
              Manage wallets →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const buildWeeklySeries = (transactions: AppState["transactions"]) => {
  const today = new Date()
  return Array.from({ length: 7 })
    .map((_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      const label = date.toLocaleDateString("en-US", { weekday: "short" })
      const count = transactions.filter((tx) => {
        const txDate = new Date(tx.timestamp)
        return (
          txDate.getUTCFullYear() === date.getUTCFullYear() &&
          txDate.getUTCMonth() === date.getUTCMonth() &&
          txDate.getUTCDate() === date.getUTCDate()
        )
      }).length
      return { label, value: count }
    })
    .map((entry, index, arr) =>
      entry.value === 0 ? { ...entry, value: arr[Math.max(0, index - 1)]?.value ?? 1 } : entry,
    )
}

type TokenHoldingWithMeta = {
  tokenId: string
  token: AppState["tokens"][number]
  amount: number
  value: number
}

const buildTokenDistribution = (holdings: TokenHoldingWithMeta[]) => {
  const total = holdings.reduce((sum, holding) => sum + holding.value, 0)
  return holdings.map((holding) => ({
    label: holding.token.symbol,
    value: total ? (holding.value / total) * 100 : 0,
  }))
}
