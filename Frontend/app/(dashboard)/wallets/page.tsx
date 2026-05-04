"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/page-header"
import { SearchInput } from "@/components/search-input"
import { StatusBadge } from "@/components/status-badge"
import { CopyButton } from "@/components/copy-button"
import { useAppStore } from "@/store/app-store"
import { formatDate, formatHash } from "@/lib/utils"

export default function WalletsPage() {
  const { wallets, users, tokens, addWallet, currentUser } = useAppStore((state) => ({
    wallets: state.wallets,
    users: state.users,
    tokens: state.tokens,
    addWallet: state.addWallet,
    currentUser: state.currentUser,
  }))

  const [searchTerm, setSearchTerm] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [label, setLabel] = useState("")
  const [ownerId, setOwnerId] = useState(users[0]?.id ?? "")
  const [tokenSelection, setTokenSelection] = useState<{ tokenId: string; amount: string }>({
    tokenId: tokens[0]?.id ?? "",
    amount: "",
  })
  const [holdings, setHoldings] = useState<{ tokenId: string; amount: number }[]>([])

  const ownersById = useMemo(() => Object.fromEntries(users.map((user) => [user.id, user])), [users])
  const visibleWallets = useMemo(() => {
    if (!currentUser) return []
    return wallets.filter((wallet) => wallet.userId === currentUser.id)
  }, [wallets, currentUser])

  const filteredWallets = useMemo(() => {
    if (!searchTerm) return visibleWallets
    return visibleWallets.filter((wallet) => {
      const owner = ownersById[wallet.userId]
      const haystack = [
        wallet.address,
        wallet.label,
        owner?.name ?? "",
        owner?.email ?? "",
      ].join(" ")
      return haystack.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [visibleWallets, ownersById, searchTerm])

  const resetForm = () => {
    setLabel("")
    setOwnerId(users[0]?.id ?? "")
    setHoldings([])
    setTokenSelection({ tokenId: tokens[0]?.id ?? "", amount: "" })
  }

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!ownerId) {
      toast.error("Select an owner")
      return
    }

    try {
      setIsSubmitting(true)
      const wallet = await addWallet({
        label,
        userId: ownerId,
        tokenHoldings: holdings,
      })

      toast.success(`Wallet ${wallet.label} created`)
      resetForm()
      setIsCreating(false)
    } catch (error) {

    } finally {
      setIsSubmitting(false)
    }
  }

  const addHolding = () => {
    if (!tokenSelection.tokenId || !tokenSelection.amount) return
    setHoldings((prev) => [
      ...prev.filter((holding) => holding.tokenId !== tokenSelection.tokenId),
      { tokenId: tokenSelection.tokenId, amount: Number(tokenSelection.amount) },
    ])
    setTokenSelection((prev) => ({ ...prev, amount: "" }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Wallets"
        description="Wallets assigned to your account."
        actions={
          <Button onClick={() => setIsCreating((state) => !state)}>
            {isCreating ? "Close form" : "Create wallet"}
          </Button>
        }
      />

      {isCreating && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>New wallet</CardTitle>
            <CardDescription>Provision a wallet for any workspace user.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wallet-label">Label</Label>
                  <Input
                    id="wallet-label"
                    placeholder="Treasury Ops"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wallet-owner">Owner</Label>
                  <Select value={ownerId} onValueChange={setOwnerId}>
                    <SelectTrigger id="wallet-owner">
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Seed token holdings (optional)</Label>
                <div className="flex flex-col gap-3 md:flex-row">
                  <Select
                    value={tokenSelection.tokenId}
                    onValueChange={(value) => setTokenSelection((state) => ({ ...state, tokenId: value }))}
                  >
                    <SelectTrigger className="md:w-48">
                      <SelectValue placeholder="Token" />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens.map((token) => (
                        <SelectItem key={token.id} value={token.id}>
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={tokenSelection.amount}
                    onChange={(event) => setTokenSelection((state) => ({ ...state, amount: event.target.value }))}
                  />
                  <Button type="button" variant="outline" onClick={addHolding}>
                    Add holding
                  </Button>
                </div>
                {holdings.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {holdings.map((holding) => {
                      const token = tokens.find((token) => token.id === holding.tokenId)
                      return (
                        <span key={holding.tokenId} className="rounded-full bg-muted px-3 py-1 text-xs">
                          {token?.symbol ?? holding.tokenId} · {holding.amount}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create wallet"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>My wallet inventory</CardTitle>
          <CardDescription>
            Track balances across your wallets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchInput
            placeholder="Search by label or address..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Holdings</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWallets.map((wallet) => {
                  const owner = ownersById[wallet.userId]
                  const holdingSymbols = wallet.tokenHoldings
                    .map((holding) => tokens.find((token) => token.id === holding.tokenId)?.symbol)
                    .filter(Boolean)
                    .join(", ")

                  return (
                    <TableRow key={wallet.id}>
                      <TableCell>
                        <Link href={`/wallets/${wallet.id}`} className="font-medium hover:underline">
                          {wallet.label}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{holdingSymbols || "—"}</TableCell>
                      <TableCell className="flex items-center gap-2 font-mono text-xs">
                        <Link href={`/wallets/${wallet.id}`} className="hover:underline">
                          {formatHash(wallet.address)}
                        </Link>
                        <CopyButton value={wallet.address} variant="ghost" size="icon" className="h-6 w-6" />
                      </TableCell>
                      <TableCell>{formatDate(wallet.createdAt)}</TableCell>
                      <TableCell>
                        <StatusBadge status={wallet.status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredWallets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No wallets assigned to your account yet.
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

