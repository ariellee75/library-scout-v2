import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"

// GET: Public stats for homepage
export async function GET(request: Request) {
  // Rate limiting for stats endpoint
  const clientId = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`stats:${clientId}`, RATE_LIMITS.stats)
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    )
  }

  const supabase = await createClient()

  // Get stats in parallel
  const [
    uniqueSessionsResult,
    profilesResult,
    savesResult,
    sharesResult,
    calendarResult,
    linksResult,
  ] = await Promise.all([
    // Count unique session_ids from class_analytics (all visitors who interacted)
    supabase.from("class_analytics").select("session_id"),
    // Count registered users
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    // Saves
    supabase.from("saved_classes").select("*", { count: "exact", head: true }),
    // Shares
    supabase.from("class_shares").select("*", { count: "exact", head: true }),
    // Calendar adds
    supabase.from("ics_downloads").select("*", { count: "exact", head: true }),
    // Link clicks (NYPL site visits)
    supabase.from("link_clicks").select("*", { count: "exact", head: true }),
  ])

  // Count unique session_ids (students = unique visitors who engaged)
  const uniqueSessions = new Set(
    (uniqueSessionsResult.data || [])
      .map(row => row.session_id)
      .filter(Boolean)
  )
  // Include registered users who may not have a session_id in analytics
  const students = Math.max(uniqueSessions.size, profilesResult.count ?? 0)
  
  // Classes attended = sum of link clicks, shares, saves, calendar adds
  const classesAttended = 
    (savesResult.count ?? 0) + 
    (sharesResult.count ?? 0) + 
    (calendarResult.count ?? 0) + 
    (linksResult.count ?? 0)

  return NextResponse.json({
    students,
    classesAttended,
  })
}
