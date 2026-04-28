"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { SearchInput } from "@/components/search-input"
import { HashLink } from "@/components/hash-link"
import { StatusBadge } from "@/components/status-badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { useAppStore } from "@/store/app-store"
import { formatDate } from "@/lib/utils"

export default function TransactionsPage() {
  const { transactions, tokens, wallets, blocks, currentUser } = useAppStore((state) => ({
    transactions: state.transactions,
    tokens: state.tokens,
    wallets: state.wallets,
    blocks: state.blocks,
    currentUser: state.currentUser,
  }))

  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6

  const walletById = useMemo(
    () =>
      wallets.reduce<Record<string, (typeof wallets)[number]>>((acc, wallet) => {
        acc[wallet.id] = wallet
        return acc
      }, {}),
    [wallets],
  )
  const tokenById = useMemo(
    () =>
      tokens.reduce<Record<string, (typeof tokens)[number]>>((acc, token) => {
        acc[token.id] = token
        return acc
      }, {}),
    [tokens],
  )
  const blockById = useMemo(
    () =>
      blocks.reduce<Record<string, (typeof blocks)[number]>>((acc, block) => {
        acc[block.id] = block
        return acc
      }, {}),
    [blocks],
  )

  const userWallets = useMemo(() => {
    if (!currentUser) return []
    return wallets.filter((wallet) => wallet.userId === currentUser.id)
  }, [wallets, currentUser])

  const walletIds = useMemo(() => new Set(userWallets.map((wallet) => wallet.id)), [userWallets])

  const myTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) => walletIds.has(transaction.fromWalletId) || walletIds.has(transaction.toWalletId),
      ),
    [transactions, walletIds],
  )

  useEffect(() => {
    setPage(1)
  }, [query])

  const filteredTransactions = useMemo(() => {
    if (!query) return myTransactions
    return myTransactions.filter((transaction) =>
      transaction.hash.toLowerCase().includes(query.toLowerCase()),
    )
  }, [myTransactions, query])

  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
  const paginatedTransactions = filteredTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const canViewWallet = (walletId: string | undefined) => {
    if (!walletId) return false
    const wallet = walletById[walletId]
    if (!wallet) return false
    return wallet.userId === currentUser?.id
  }

  const renderWalletCell = (walletId: string | undefined) => {
    if (!walletId) return "—"
    const wallet = walletById[walletId]
    if (!wallet) return walletId
    if (canViewWallet(walletId)) {
      return (
        <Link href={`/wallets/${wallet.id}`} className="hover:underline">
          {wallet.label}
        </Link>
      )
    }
    return wallet.label
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Transactions" description="Only transfers sent from or received by your wallets." />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Personal transaction log</CardTitle>
          <CardDescription>Newest wallet activity first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchInput
            placeholder="Search my transaction hashes..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hash</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => {
                  const token = tokenById[transaction.tokenId]
                  const block = blockById[transaction.blockId]
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <HashLink hash={transaction.hash} href={`/transactions/${transaction.id}`} />
                      </TableCell>
                      <TableCell>{token?.symbol ?? transaction.tokenId}</TableCell>
                      <TableCell>{transaction.amount}</TableCell>
                      <TableCell>{renderWalletCell(transaction.fromWalletId)}</TableCell>
                      <TableCell>{renderWalletCell(transaction.toWalletId)}</TableCell>
                      <TableCell>{block ? `#${block.height}` : transaction.blockId}</TableCell>
                      <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                      <TableCell>
                        <StatusBadge status={transaction.status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
                {paginatedTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      {userWallets.length === 0
                        ? "Add a wallet to start tracking transactions."
                        : "No transactions match your search."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {filteredTransactions.length > PAGE_SIZE && (
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      setPage((prev) => Math.max(1, prev - 1))
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: pageCount }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      href="#"
                      isActive={page === index + 1}
                      onClick={(event) => {
                        event.preventDefault()
                        setPage(index + 1)
                      }}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      setPage((prev) => Math.min(pageCount, prev + 1))
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

