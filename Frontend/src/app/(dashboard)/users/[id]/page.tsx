"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { HashLink } from "@/components/hash-link"
import { useAppStore } from "@/store/app-store"
import { formatDate } from "@/lib/utils"

type UserDetailPageProps = {
  params: { id: string }
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const { users, wallets, transactions } = useAppStore((state) => ({
    users: state.users,
    wallets: state.wallets,
    transactions: state.transactions,
  }))

  const user = users.find((entry) => entry.id === params.id)

  if (!user) {
    notFound()
    return null
  }

  const ownedWallets = wallets.filter((wallet) => wallet.userId === user.id)
  const walletIds = new Set(ownedWallets.map((wallet) => wallet.id))
  const recentTransactions = transactions
    .filter((transaction) => walletIds.has(transaction.fromWalletId) || walletIds.has(transaction.toWalletId))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>{user.name}</CardTitle>
          <CardDescription>{user.title}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p>{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Organization</p>
            <p>{user.organization}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <StatusBadge status={user.status} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last login</p>
            <p>{formatDate(user.lastLogin)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created</p>
            <p>{formatDate(user.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Wallets</CardTitle>
          <CardDescription>Wallets linked to {user.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ownedWallets.map((wallet) => (
                  <TableRow key={wallet.id}>
                    <TableCell>
                      <Link href={`/wallets/${wallet.id}`} className="font-medium hover:underline">
                        {wallet.label}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{wallet.address}</TableCell>
                    <TableCell>
                      <StatusBadge status={wallet.status} />
                    </TableCell>
                    <TableCell>{formatDate(wallet.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {ownedWallets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No wallets yet.
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
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest transactions touching this user&apos;s wallets.</CardDescription>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => {
                  const isOutgoing = walletIds.has(transaction.fromWalletId)
                  const counterpartyId = isOutgoing ? transaction.toWalletId : transaction.fromWalletId
                  const counterpartyWallet = wallets.find((wallet) => wallet.id === counterpartyId)

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <HashLink hash={transaction.hash} href={`/transactions/${transaction.id}`} />
                      </TableCell>
                      <TableCell>{isOutgoing ? "Sent" : "Received"}</TableCell>
                      <TableCell>
                        {counterpartyWallet ? (
                          <Link href={`/wallets/${counterpartyWallet.id}`} className="hover:underline">
                            {counterpartyWallet.label}
                          </Link>
                        ) : (
                          counterpartyId
                        )}
                      </TableCell>
                      <TableCell>{transaction.tokenId}</TableCell>
                      <TableCell>{transaction.amount}</TableCell>
                    </TableRow>
                  )
                })}
                {recentTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No recent activity.
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

