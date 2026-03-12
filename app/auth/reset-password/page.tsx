"use client"

import React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BookOpen, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    // Check if user has a valid recovery session
    async function checkSession() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setIsValidSession(!!session)
      setCheckingSession(false)
    }
    checkSession()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    
    if (error) {
      toast.error(error.message)
    } else {
      setSuccess(true)
      // Sign out so they can sign in with new password
      await supabase.auth.signOut()
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-center border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link
          href="/"
          className="flex items-center gap-2 text-base sm:text-lg font-bold text-foreground"
        >
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-serif whitespace-nowrap">Library Scout</span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            {success ? (
              <>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold font-serif text-foreground">
                  Password updated
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your password has been successfully reset
                </CardDescription>
              </>
            ) : !isValidSession ? (
              <>
                <CardTitle className="text-2xl font-bold font-serif text-foreground">
                  Invalid or expired link
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  This password reset link is no longer valid
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl font-bold font-serif text-foreground">
                  Reset your password
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your new password below
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {success ? (
              <Link href="/auth/login">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Sign in with new password
                </Button>
              </Link>
            ) : !isValidSession ? (
              <Link href="/auth/forgot-password">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Request a new link
                </Button>
              </Link>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="password" className="text-foreground">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="mt-1.5 bg-background"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="mt-1.5 bg-background"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
