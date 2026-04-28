"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/store/app-store"
import { emailApi, usersApi, p2pApi } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

export function EmailNotifications() {
  const { currentUser } = useAppStore()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (currentUser) {
      loadNotifications()

      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser])

  const loadNotifications = async () => {
    if (!currentUser) return
    try {
      const userProfile = await usersApi.getProfile(currentUser.id)
      const notifs = await emailApi.getNotifications(userProfile.user_id)
      setNotifications(notifs)
      setUnreadCount(notifs.length)
    } catch (error) {
      console.error("Failed to load notifications:", error)
    }
  }

  const handleMarkAsRead = async (verificationId: number) => {
    try {
      await emailApi.markAsRead(verificationId)
      loadNotifications()
      toast.success("Notification marked as read")
    } catch (error) {
      toast.error("Failed to mark as read")
    }
  }

  const handleAcceptP2P = async (e: React.MouseEvent, p2pTxId: number) => {
    e.stopPropagation()
    if (!currentUser) return
    
    try {
      const userProfile = await usersApi.getProfile(currentUser.id)
      await p2pApi.acceptTransaction(p2pTxId.toString(), parseInt(userProfile.user_id))
      toast.success("P2P transaction accepted!")
      loadNotifications()
    } catch (error: any) {
      const message = error.data?.message || error.message || "Failed to accept transaction"
      toast.error(message)
    }
  }

  const handleRejectP2P = async (e: React.MouseEvent, p2pTxId: number) => {
    e.stopPropagation()
    if (!currentUser) return
    
    try {
      const userProfile = await usersApi.getProfile(currentUser.id)
      await p2pApi.rejectTransaction(p2pTxId.toString(), parseInt(userProfile.user_id))
      toast.success("P2P transaction rejected")
      loadNotifications()
    } catch (error: any) {
      const message = error.data?.message || error.message || "Failed to reject transaction"
      toast.error(message)
    }
  }

  if (!currentUser) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-error text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Email Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notif) => (
              <div
                key={notif.verification_id}
                className="border-b last:border-b-0"
              >
                {notif.type === "p2p_request" && notif.p2p_tx_id ? (
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">P2P Transaction Request</p>
                        <p className="text-xs text-muted-foreground">
                          {notif.buyer_username || "Buyer"} wants to buy {notif.p2p_amount} {notif.token_symbol || "tokens"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(notif.created_at)}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">New</Badge>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 h-7 text-xs"
                        onClick={(e) => handleAcceptP2P(e, notif.p2p_tx_id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 h-7 text-xs"
                        onClick={(e) => handleRejectP2P(e, notif.p2p_tx_id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ) : (
                  <DropdownMenuItem
                    className="flex flex-col items-start p-3 cursor-pointer"
                    onClick={() => handleMarkAsRead(notif.verification_id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        {notif.type === "transaction" && (
                          <>
                            <p className="text-sm font-medium">Transaction Completed</p>
                            <p className="text-xs text-muted-foreground">
                              {notif.token_symbol} - {notif.amount} tokens
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(notif.created_at)}
                            </p>
                          </>
                        )}
                        {notif.type === "signup" && (
                          <>
                            <p className="text-sm font-medium">Verify Your Email</p>
                            <p className="text-xs text-muted-foreground">
                              Click to verify your email address
                            </p>
                          </>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2">New</Badge>
                    </div>
                  </DropdownMenuItem>
                )}
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

