"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/copy-button"
import { HashLink } from "@/components/hash-link"
import { StatusBadge } from "@/components/status-badge"
import { useAppStore } from "@/store/app-store"
import { formatCurrency, formatDate } from "@/lib/utils"

type WalletDetailPageProps = {
  params: { id: string }
}

export default function WalletDetailPage({ params }: WalletDetailPageProps) {
  const { wallets, users, tokens, transactions, currentUser } = useAppStore((state) => ({
    wallets: state.wallets,
    users: state.users,
    tokens: state.tokens,
    transactions: state.transactions,
    currentUser: state.currentUser,
  }))

  const wallet = wallets.find((entry) => entry.id === params.id)
  if (!wallet) {
    notFound()
    return null
  }

  const canView = wallet.userId === currentUser?.id

  if (!canView) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Restricted wallet</CardTitle>
          <CardDescription>This wallet isn&apos;t assigned to your user.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const owner = users.find((user) => user.id === wallet.userId)
  const holdings = wallet.tokenHoldings
    .map((holding) => {
      const token = tokens.find((token) => token.id === holding.tokenId)
      if (!token) return null
      return {
        ...holding,
        token,
        value: holding.amount * token.priceUsd,
      }
    })
    .filter(Boolean) as Array<{ token: (typeof tokens)[number]; amount: number; value: number }>

  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0)

  const walletTransactions = transactions.filter(
    (transaction) => transaction.fromWalletId === wallet.id || transaction.toWalletId === wallet.id,
  )

  const canOpenWallet = (walletId: string | undefined) => {
    if (!walletId) return false
    const target = wallets.find((entry) => entry.id === walletId)
    return target?.userId === currentUser?.id
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>{wallet.label}</CardTitle>
          <CardDescription>Owned by {owner?.name ?? wallet.userId}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Address</p>
            <div className="flex items-center gap-3 font-mono text-xs">
              {wallet.address}
              <CopyButton value={wallet.address} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Created</p>
            <p>{formatDate(wallet.createdAt)}</p>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Owner</p>
            {owner ? owner.name : wallet.userId}
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Status</p>
            <StatusBadge status={wallet.status} />
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Portfolio value</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalValue)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Token holdings</CardTitle>
          <CardDescription>Current balances for this wallet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>USD value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((holding) => (
                  <TableRow key={holding.token.id}>
                    <TableCell>
                      <Link href={`/tokens/${holding.token.id}`} className="hover:underline">
                        {holding.token.symbol}
                      </Link>
                    </TableCell>
                    <TableCell>{holding.amount}</TableCell>
                    <TableCell>{formatCurrency(holding.value)}</TableCell>
                  </TableRow>
                ))}
                {holdings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
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
          <CardDescription>Transfers where this wallet was the sender or receiver.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hash</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walletTransactions.map((transaction) => {
                  const isOutgoing = transaction.fromWalletId === wallet.id
                  const counterpartyId = isOutgoing ? transaction.toWalletId : transaction.fromWalletId
                  const counterparty = wallets.find((w) => w.id === counterpartyId)
                  const token = tokens.find((token) => token.id === transaction.tokenId)

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <HashLink hash={transaction.hash} href={`/transactions/${transaction.id}`} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={isOutgoing ? "destructive" : "outline"}>
                          {isOutgoing ? "Sent" : "Received"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {counterparty && canOpenWallet(counterparty.id) ? (
                          <Link href={`/wallets/${counterparty.id}`} className="hover:underline">
                            {counterparty.label}
                          </Link>
                        ) : (
                          counterparty?.label ?? counterpartyId
                        )}
                      </TableCell>
                      <TableCell>{token?.symbol ?? transaction.tokenId}</TableCell>
                      <TableCell>{transaction.amount}</TableCell>
                      <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                    </TableRow>
                  )
                })}
                {walletTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
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
