"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usersApi } from "@/lib/api"
import { CheckCircle, Mail, Loader2 } from "lucide-react"
import Link from "next/link"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get("email")
    
    if (emailParam) {
      setEmail(emailParam)
    }
    setIsLoading(false)
  }, [searchParams])

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setCode(value)
  }

  const handleVerify = async () => {
    if (!code) {
      toast.error("Verification code is required")
      return
    }

    if (code.length !== 6) {
      toast.error("Verification code must be 6 digits")
      return
    }

    setIsVerifying(true)
    try {
      await usersApi.verifyEmail(code)
      setIsVerified(true)
      toast.success("Email verified successfully! Your wallet has been created.")

      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: any) {
      const message = error.data?.message || error.message || "Verification failed"
      toast.error(message)
    } finally {
      setIsVerifying(false)
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleVerify()
  }

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Email address is required")
      return
    }

    setIsResending(true)
    try {
      await usersApi.resendVerification(email)
      toast.success("Verification email sent! Please check your inbox.")
    } catch (error: any) {
      const message = error.data?.message || error.message || "Failed to resend verification email"
      toast.error(message)
    } finally {
      setIsResending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Verifying email...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (email && !code && !isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-semibold">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a 6-digit verification code to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-foreground text-center">
                  📧 Please check your email inbox for the verification code.
                </p>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Enter the 6-digit code below to verify your email.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={handleCodeChange}
                    className="text-center text-2xl font-mono tracking-widest"
                    autoFocus
                    required
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Enter the 6-digit code from your email
                  </p>
                </div>
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={isVerifying || code.length !== 6}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Email"
                  )}
                </Button>
              </form>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  Didn't receive the code? Check your spam folder or
                </p>
                <Button 
                  onClick={handleResendVerification}
                  disabled={isResending}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Verification Code"
                  )}
                </Button>
              </div>
              <Button 
                onClick={() => router.push("/login")} 
                variant="ghost"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-2xl font-semibold">Email Verified!</CardTitle>
            <CardDescription>Your email has been verified and your wallet has been created automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                <p className="text-sm text-foreground">
                  ✅ Email verified successfully
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ✅ Wallet created automatically
                </p>
              </div>
              <Button 
                onClick={() => router.push("/login")} 
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold">Verify Your Email</CardTitle>
          <CardDescription>
            Enter the 6-digit verification code sent to your email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your email to resend verification code if needed
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={handleCodeChange}
                  className="text-center text-2xl font-mono tracking-widest"
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isVerifying || code.length !== 6}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>
          </form>
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <Button 
              onClick={handleResendVerification}
              disabled={isResending || !email}
              variant="outline"
              size="sm"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend Verification Code"
              )}
            </Button>
            {!email && (
              <p className="text-xs text-muted-foreground mt-2">
                Enter your email above to resend
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
          <Card className="w-full max-w-md">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}

