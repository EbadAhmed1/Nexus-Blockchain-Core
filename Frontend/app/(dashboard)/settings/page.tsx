"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useAppStore } from "@/store/app-store"
import { usersApi, emailApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, Bell, Key, Trash2, AlertTriangle, Loader2 } from "lucide-react"

export default function SettingsPage() {
  const { currentUser } = useAppStore()
  const [profile, setProfile] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [requiresCode, setRequiresCode] = useState(false)
  const [deleteCode, setDeleteCode] = useState("")
  const [isRequestingCode, setIsRequestingCode] = useState(false)

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
  })

  const [settings, setSettings] = useState({
    emailNotifications: true,
    transactionAlerts: true,
    priceAlerts: false,
    marketingEmails: false,
  })

  useEffect(() => {
    if (currentUser) {
      loadProfile()
      loadNotifications()
    }
  }, [currentUser])

  const loadProfile = async () => {
    if (!currentUser) return
    setIsLoading(true)
    try {

      const userId = currentUser.id.includes("user-") 
        ? currentUser.id.replace("user-", "") 
        : currentUser.id
      const userProfile = await usersApi.getProfile(userId)
      setProfile(userProfile)
      setProfileForm({
        fullName: userProfile.full_name || "",
        phone: userProfile.phone || "",
      })
    } catch (error) {
      console.error("Failed to load profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const loadNotifications = async () => {
    if (!currentUser) return
    try {

      const userProfile = await usersApi.getProfile(currentUser.id)
      if (userProfile && userProfile.user_id) {
        const notifs = await emailApi.getNotifications(parseInt(userProfile.user_id))
        setNotifications(notifs)
      }
    } catch (error) {
      console.error("Failed to load notifications:", error)

    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setIsSaving(true)
    try {
      await usersApi.updateProfile(currentUser.id, profileForm)
      toast.success("Profile updated successfully")
      loadProfile()
    } catch (error: any) {
      toast.error(error.data?.message || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }


  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setDeleteCode(value)
  }

  const handleDeleteAccount = async () => {
    if (!currentUser) return
    
    if (!showDeleteConfirm) {

      setShowDeleteConfirm(true)
      return
    }

    if (deleteConfirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm')
      return
    }

    if (!requiresCode) {
      setIsRequestingCode(true)
      try {
        await usersApi.requestDeleteAccount(currentUser.id)
        setRequiresCode(true)
        toast.info("Verification code sent to your email. Please enter it to confirm deletion.")
      } catch (error: any) {
        toast.error(error.data?.message || error.message || "Failed to send verification code")
      } finally {
        setIsRequestingCode(false)
      }
      return
    }

    if (deleteCode.length !== 6) {
      toast.error("Please enter a 6-digit verification code")
      return
    }

    setIsDeleting(true)
    try {
      await usersApi.deleteAccount(currentUser.id, deleteCode)
      toast.success("Account deleted successfully")

      useAppStore.getState().logout()
      window.location.href = "/login"
    } catch (error: any) {
      toast.error(error.data?.message || error.message || "Failed to delete account")
      setIsDeleting(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please login to access settings</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">Loading profile...</div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={currentUser.email} disabled className="bg-[#1E2329]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>
                  <Button type="submit" disabled={isSaving} className="w-full">
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Change Password</Label>
                    <p className="text-sm text-muted-foreground">Update your account password</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>

              {/* Delete Account Section */}
              <div className="mt-8 pt-8 border-t border-destructive/20">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Danger Zone
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                  </div>

                  {!showDeleteConfirm ? (
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete My Account
                    </Button>
                  ) : (
                    <div className="space-y-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      {!requiresCode ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="deleteConfirmText" className="text-destructive">
                              Type "DELETE" to confirm
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              This action cannot be undone. All your data will be permanently deleted.
                            </p>
                            <Input
                              id="deleteConfirmText"
                              type="text"
                              placeholder="Type DELETE here"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              className="font-mono"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              onClick={handleDeleteAccount}
                              disabled={isRequestingCode || deleteConfirmText !== "DELETE"}
                              className="flex-1"
                            >
                              {isRequestingCode ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Sending Code...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Request Verification Code
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowDeleteConfirm(false)
                                setDeleteConfirmText("")
                                setRequiresCode(false)
                                setDeleteCode("")
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 mb-4">
                            <p className="text-sm text-foreground text-center">
                              📧 Verification code sent to <strong>{currentUser?.email}</strong>
                            </p>
                            <p className="text-xs text-muted-foreground text-center mt-1">
                              Enter the 6-digit code from your email to confirm account deletion
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="deleteCode" className="text-destructive">
                              Verification Code
                            </Label>
                            <Input
                              id="deleteCode"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              placeholder="000000"
                              value={deleteCode}
                              onChange={handleCodeChange}
                              className="text-center text-2xl font-mono tracking-widest"
                              autoFocus
                            />
                            <p className="text-xs text-muted-foreground text-center">
                              Enter the 6-digit code from your email
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              onClick={handleDeleteAccount}
                              disabled={isDeleting || deleteCode.length !== 6}
                              className="flex-1"
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Confirm Deletion
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setRequiresCode(false)
                                setDeleteCode("")
                              }}
                            >
                              Back
                            </Button>
                          </div>
                        </>
                      )}
                      {!requiresCode && (
                        <div className="p-3 bg-destructive/20 border border-destructive/30 rounded text-sm text-destructive">
                          <p className="font-semibold mb-1">⚠️ Warning: This action is irreversible!</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>All your data will be permanently deleted</li>
                            <li>All wallets and token holdings will be removed</li>
                            <li>All transaction history will be lost</li>
                            <li>You cannot recover your account after deletion</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, emailNotifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Transaction Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified about transactions</p>
                  </div>
                  <Switch
                    checked={settings.transactionAlerts}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, transactionAlerts: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Price Alerts</Label>
                    <p className="text-sm text-muted-foreground">Price change notifications</p>
                  </div>
                  <Switch
                    checked={settings.priceAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, priceAlerts: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">Receive promotional emails</p>
                  </div>
                  <Switch
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, marketingEmails: checked })
                    }
                  />
                </div>
              </div>

              {notifications.length > 0 && (
                <div className="mt-8">
                  <Label className="mb-4 block">Recent Notifications</Label>
                  <div className="space-y-2">
                    {notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.verification_id}
                        className="p-3 bg-[#1E2329] rounded-lg border border-[#2B3139]"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {notif.type === "transaction" ? "Transaction Alert" : "Email Verification"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notif.verified && (
                            <Badge variant="outline" className="border-warning text-warning">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
