import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(request: Request) {
  // Strict rate limiting for account deletion
  const clientId = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`delete-account:${clientId}`, RATE_LIMITS.auth)
  
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Delete user data from all related tables
  await Promise.all([
    supabase.from("user_interests").delete().eq("user_id", user.id),
    supabase.from("user_archetypes").delete().eq("user_id", user.id),
    supabase.from("user_time_prefs").delete().eq("user_id", user.id),
    supabase.from("saved_classes").delete().eq("user_id", user.id),
    supabase.from("feedback").delete().eq("user_id", user.id),
    supabase.from("reports").delete().eq("user_id", user.id),
    supabase.from("profiles").delete().eq("id", user.id),
  ])

  // Sign out (the auth.admin.deleteUser would require service role key)
  // For now, we sign out and remove profile data
  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}
