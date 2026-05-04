"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { HashLink } from "@/components/hash-link"
import { StatusBadge } from "@/components/status-badge"
import { useAppStore } from "@/store/app-store"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils"

type TokenDetailPageProps = {
  params: { id: string }
}

export default function TokenDetailPage({ params }: TokenDetailPageProps) {
  const { tokens, wallets, transactions } = useAppStore((state) => ({
    tokens: state.tokens,
    wallets: state.wallets,
    transactions: state.transactions,
  }))

  const token = tokens.find((entry) => entry.id === params.id)
  if (!token) {
    notFound()
    return null
  }

  const holders = wallets
    .map((wallet) => {
      const holding = wallet.tokenHoldings.find((entry) => entry.tokenId === token.id)
      if (!holding || holding.amount <= 0) return null
      return { wallet, amount: holding.amount }
    })
    .filter(Boolean) as Array<{ wallet: (typeof wallets)[number]; amount: number }>

  const totalHeld = holders.reduce((sum, entry) => sum + entry.amount, 0)
  const tokenTransactions = transactions.filter((transaction) => transaction.tokenId === token.id)

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{token.name}</CardTitle>
              <CardDescription>{token.symbol}</CardDescription>
            </div>
            <Badge variant={token.change24h >= 0 ? "outline" : "destructive"}>
              {token.change24h >= 0 ? "+" : ""}
              {token.change24h.toFixed(2)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Metric label="Price" value={formatCurrency(token.priceUsd)} />
          <Metric label="Market cap" value={formatCurrency(token.marketCapUsd)} />
          <Metric label="Supply" value={formatNumber(token.supply)} />
          <Metric label="Holders" value={holders.length.toString()} />
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Top holders</CardTitle>
          <CardDescription>Wallets holding {token.symbol}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Share</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holders.map((entry) => (
                  <TableRow key={entry.wallet.id}>
                    <TableCell>
                      <Link href={`/wallets/${entry.wallet.id}`} className="hover:underline">
                        {entry.wallet.label}
                      </Link>
                    </TableCell>
                    <TableCell>{entry.amount}</TableCell>
                    <TableCell>
                      {totalHeld ? `${((entry.amount / totalHeld) * 100).toFixed(2)}%` : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={entry.wallet.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {holders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No holdings recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
          <CardDescription>Transfers filtered by {token.symbol}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hash</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokenTransactions.map((transaction) => {
                  const sender = wallets.find((wallet) => wallet.id === transaction.fromWalletId)
                  const receiver = wallets.find((wallet) => wallet.id === transaction.toWalletId)
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <HashLink hash={transaction.hash} href={`/transactions/${transaction.id}`} />
                      </TableCell>
                      <TableCell>
                        {sender ? (
                          <Link href={`/wallets/${sender.id}`} className="hover:underline">
                            {sender.label}
                          </Link>
                        ) : (
                          transaction.fromWalletId
                        )}
                      </TableCell>
                      <TableCell>
                        {receiver ? (
                          <Link href={`/wallets/${receiver.id}`} className="hover:underline">
                            {receiver.label}
                          </Link>
                        ) : (
                          transaction.toWalletId
                        )}
                      </TableCell>
                      <TableCell>{transaction.amount}</TableCell>
                      <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                    </TableRow>
                  )
                })}
                {tokenTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  )
}

