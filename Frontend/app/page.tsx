"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAppStore } from "@/store/app-store"

export default function Home() {
  const router = useRouter()
  const currentUser = useAppStore((state) => state.currentUser)

  useEffect(() => {
    router.replace(currentUser ? "/dashboard" : "/login")
  }, [currentUser, router])

  return null
}
