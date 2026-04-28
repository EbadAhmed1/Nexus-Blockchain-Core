"use client"

import Link from "next/link"
import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { SearchInput } from "@/components/search-input"
import { StatusBadge } from "@/components/status-badge"
import { useAppStore } from "@/store/app-store"
import { usersApi } from "@/lib/api"
import { formatDate } from "@/lib/utils"

export default function UsersPage() {
  const { wallets } = useAppStore((state) => ({
    wallets: state.wallets,
  }))

  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const usersData = await usersApi.getAll(100, 0)
      setUsers(usersData)
    } catch (error) {
      console.error("Failed to load users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const walletCounts = useMemo(() => {
    return wallets.reduce<Record<string, number>>((acc, wallet) => {
      const userId = wallet.userId?.toString()
      if (userId) {
        acc[userId] = (acc[userId] ?? 0) + 1
      }
      return acc
    }, {})
  }, [wallets])

  const filteredUsers = useMemo(() => {
    if (!query) return users
    return users.filter((user) =>
      `${user.full_name || user.username || ''} ${user.email || ''}`.toLowerCase().includes(query.toLowerCase()),
    )
  }, [users, query])

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="View all registered users." />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>Click on a user to open their profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchInput placeholder="Search user by name or email..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Wallets</TableHead>
                  <TableHead>Last login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <Link href={`/users/${user.user_id}`} className="font-medium hover:underline">
                          {user.full_name || user.username || 'Unknown'}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <StatusBadge status={user.status || 'active'} />
                      </TableCell>
                      <TableCell>{walletCounts[user.user_id?.toString()] ?? 0}</TableCell>
                      <TableCell>{user.created_at ? formatDate(user.created_at) : 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

