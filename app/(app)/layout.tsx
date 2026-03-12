import React from "react"
import { createClient } from "@/lib/supabase/server"
import { AppHeader } from "@/components/app-header"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()
    isAdmin = profile?.is_admin === true
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        user={user ? { id: user.id, email: user.email } : null}
        isAdmin={isAdmin}
      />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
        Library Scout &mdash; Discover your next favorite class at the library.
      </footer>
    </div>
  )
}
