"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HashLink } from "@/components/hash-link"
import { StatusBadge } from "@/components/status-badge"
import { CopyButton } from "@/components/copy-button"
import { useAppStore } from "@/store/app-store"
import { formatDate } from "@/lib/utils"

type BlockDetailPageProps = {
  params: { id: string }
}

export default function BlockDetailPage({ params }: BlockDetailPageProps) {
  const { blocks, transactions, tokens, wallets } = useAppStore((state) => ({
    blocks: state.blocks,
    transactions: state.transactions,
    tokens: state.tokens,
    wallets: state.wallets,
  }))

  const block = blocks.find((entry) => entry.id === params.id)
  if (!block) {
    notFound()
    return null
  }

  const blockTransactions = transactions.filter((transaction) => transaction.blockId === block.id)

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Block {block.height}</CardTitle>
          <CardDescription>Produced {formatDate(block.timestamp)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Hash</p>
            <div className="flex items-center gap-2 font-mono text-xs">
              <HashLink hash={block.hash} href={`/blocks/${block.id}`} />
              <CopyButton value={block.hash} />
            </div>
          </div>
          <Metric label="Tx count" value={block.transactionIds.length.toString()} />
          <Metric label="Gas used" value={block.gasUsed.toLocaleString()} />
          <Metric label="Gas limit" value={block.gasLimit.toLocaleString()} />
          <Metric label="Reward" value={`${block.reward} BLK`} />
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <StatusBadge status={block.status} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Transfers included in this block.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hash</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockTransactions.map((transaction) => {
                  const sender = wallets.find((wallet) => wallet.id === transaction.fromWalletId)
                  const receiver = wallets.find((wallet) => wallet.id === transaction.toWalletId)
                  const token = tokens.find((token) => token.id === transaction.tokenId)
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
                      <TableCell>{token?.symbol ?? transaction.tokenId}</TableCell>
                      <TableCell>{transaction.amount}</TableCell>
                      <TableCell>
                        <StatusBadge status={transaction.status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
                {blockTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No transactions recorded in this block.
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

