"use client"

import { useEffect } from "react"
import { useAppStore } from "@/store/app-store"

export function DataInitializer() {
  const { fetchBlocks, fetchWallets, fetchTransactions, currentUser } = useAppStore()

  useEffect(() => {
    fetchBlocks()
    fetchTransactions()
    
    if (currentUser) {
      fetchWallets(currentUser.id)
    }
  }, [currentUser, fetchBlocks, fetchWallets, fetchTransactions])

  return null
}

