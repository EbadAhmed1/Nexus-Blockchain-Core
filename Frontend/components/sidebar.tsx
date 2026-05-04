"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, Wallet2, Coins, ShieldCheck, Boxes, ArrowRightLeft, Send, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/store/app-store"
import { BTCLogo } from "@/components/btc-logo"

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Market", href: "/market", icon: Coins },
  { name: "P2P Trading", href: "/p2p", icon: Send },
  { name: "Convert", href: "/convert", icon: RefreshCw },
  { name: "Wallet Management", href: "/wallet-management", icon: Wallet2 },
  { name: "Transaction History", href: "/transactions-history", icon: ArrowRightLeft },
  { name: "Settings", href: "/settings", icon: Users },
]

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, logout } = useAppStore((state) => ({
    currentUser: state.currentUser,
    logout: state.logout,
  }))

  const visibleNav = navigation

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => onOpenChange(false)} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-[#0A0000] shadow-2xl transition-transform lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[#3A0000] px-5 py-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="relative rounded-lg bg-primary/10 p-2 border border-primary/30">
                <BTCLogo className="h-8 w-8" />
                <div className="absolute inset-0 bg-primary/10 blur-md rounded-lg"></div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">BlockChain</p>
                <p className="text-xs text-muted-foreground">Explorer</p>
              </div>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => onOpenChange(false)}>
              ✕
            </Button>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
            {visibleNav.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/50" 
                      : "text-muted-foreground hover:bg-[#2A0000] hover:text-foreground",
                  )}
                  onClick={() => onOpenChange(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-[#3A0000] p-4">
            {currentUser && (
              <div className="mb-3 px-3 py-2 rounded-md bg-[#2A0000] border border-[#3A0000]">
                <p className="text-xs text-muted-foreground">Logged in as</p>
                <p className="text-sm font-medium text-foreground">{currentUser.name}</p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full border-[#3A0000] hover:bg-[#2A0000] hover:border-primary/50 hover:text-primary"
              onClick={() => {
                logout()
                router.replace("/login")
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
