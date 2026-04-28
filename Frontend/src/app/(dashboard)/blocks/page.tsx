"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { SearchInput } from "@/components/search-input"
import { HashLink } from "@/components/hash-link"
import { StatusBadge } from "@/components/status-badge"
import { useAppStore } from "@/store/app-store"
import { formatDate } from "@/lib/utils"

export default function BlocksPage() {
  const { blocks } = useAppStore((state) => ({
    blocks: state.blocks,
  }))

  const [query, setQuery] = useState("")

  const filteredBlocks = useMemo(() => {
    if (!query) return blocks
    return blocks.filter((block) => block.hash.toLowerCase().includes(query.toLowerCase()))
  }, [blocks, query])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Blocks</h1>
        <p className="text-sm text-muted-foreground mt-1">Latest finalized and pending blocks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chain Activity</CardTitle>
          <CardDescription className="text-xs">Click a block hash to dive deeper</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchInput placeholder="Search by hash..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="overflow-hidden rounded-lg border border-[#2B3139] bg-[#0B0E11]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hash</TableHead>
                  <TableHead>Height</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBlocks.map((block) => {
                  return (
                    <TableRow key={block.id}>
                      <TableCell>
                        <HashLink hash={block.hash} href={`/blocks/${block.id}`} />
                      </TableCell>
                      <TableCell>{block.height}</TableCell>
                      <TableCell>{block.transactionIds.length}</TableCell>
                      <TableCell>{formatDate(block.timestamp)}</TableCell>
                      <TableCell>
                        <StatusBadge status={block.status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredBlocks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No blocks matched your search.
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

