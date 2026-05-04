"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"
import { EmailNotifications } from "@/components/email-notifications"
import { BTCLogo } from "@/components/btc-logo"

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[#3A0000] bg-[#0A0000] px-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuClick} 
          className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-[#2A0000] hover:text-primary"
        >
          ☰
        </Button>
        <div className="hidden md:flex items-center gap-2">
          <BTCLogo className="h-5 w-5" />
          <span className="text-xs font-medium text-muted-foreground">BlockChain Explorer</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-primary">Live</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <EmailNotifications />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
