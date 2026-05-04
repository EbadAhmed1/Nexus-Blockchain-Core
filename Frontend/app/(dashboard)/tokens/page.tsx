"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { SearchInput } from "@/components/search-input"
import { useAppStore } from "@/store/app-store"
import { formatCurrency, formatNumber } from "@/lib/utils"

export default function TokensPage() {
  const { tokens, wallets, transactions, currentUser } = useAppStore((state) => ({
    tokens: state.tokens,
    wallets: state.wallets,
    transactions: state.transactions,
    currentUser: state.currentUser,
  }))

  const [query, setQuery] = useState("")

  const holdersByToken = useMemo(() => {
    const counts: Record<string, number> = {}
    wallets.forEach((wallet) => {
      wallet.tokenHoldings.forEach((holding) => {
        if (holding.amount > 0) {
          counts[holding.tokenId] = (counts[holding.tokenId] ?? 0) + 1
        }
      })
    })
    return counts
  }, [wallets])

  const txVolumeByToken = useMemo(() => {
    const counts: Record<string, number> = {}
    transactions.forEach((transaction) => {
      counts[transaction.tokenId] = (counts[transaction.tokenId] ?? 0) + 1
    })
    return counts
  }, [transactions])

  const filteredTokens = useMemo(() => {
    if (!query) return tokens
    return tokens.filter((token) =>
      `${token.name} ${token.symbol} ${token.type}`.toLowerCase().includes(query.toLowerCase()),
    )
  }, [tokens, query])



  return (
    <div className="space-y-6">
      <PageHeader
        title="Tokens"
        description="Centralized catalog of supported assets"
      />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Token inventory</CardTitle>
          <CardDescription>Live snapshot of all mock assets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchInput placeholder="Search tokens..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Market cap</TableHead>
                  <TableHead>Holders</TableHead>
                  <TableHead>24h txs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell>
                      <Link href={`/tokens/${token.id}`} className="flex flex-col">
                        <span className="font-medium">{token.name}</span>
                        <span className="text-xs uppercase text-muted-foreground">{token.symbol}</span>
                      </Link>
                    </TableCell>
                    <TableCell>{formatCurrency(token.priceUsd)}</TableCell>
                    <TableCell>{formatCurrency(token.marketCapUsd)}</TableCell>
                    <TableCell>{holdersByToken[token.id] ?? 0}</TableCell>
                    <TableCell>{formatNumber(txVolumeByToken[token.id] ?? 0)}</TableCell>
                  </TableRow>
                ))}
                {filteredTokens.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No tokens matched your search.
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

