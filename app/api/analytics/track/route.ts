import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(request: Request) {
  // Rate limiting
  const clientId = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`analytics:${clientId}`, RATE_LIMITS.analytics)
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { 
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        }
      }
    )
  }

  try {
    const { classId, category, archetype, eventType = "click", sessionId, shareType, intent } = await request.json()

    // Validate classId
    if (!classId || typeof classId !== "number") {
      return NextResponse.json({ error: "Valid classId required" }, { status: 400 })
    }

    // Validate eventType against allowed values
    const ALLOWED_EVENT_TYPES = [
      "click", "view", "ics_download", "link_click", "share", 
      "attendance_intent", "poll_browsing", "poll_interested", "poll_planning"
    ]
    if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ error: "Invalid eventType" }, { status: 400 })
    }

    // Validate sessionId format if provided (should be UUID-like)
    if (sessionId && (typeof sessionId !== "string" || sessionId.length > 100)) {
      return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get user if logged in (optional)
    const { data: { user } } = await supabase.auth.getUser()

    const baseData = {
      class_id: classId,
      user_id: user?.id || null,
      session_id: sessionId || null,
    }

    let error = null

    // Handle specific event types with dedicated tables
    switch (eventType) {
      case "ics_download":
        const icsResult = await supabase.from("ics_downloads").insert(baseData)
        error = icsResult.error
        break
      case "link_click":
        const linkResult = await supabase.from("link_clicks").insert(baseData)
        error = linkResult.error
        break
      case "share":
        if (!shareType) {
          return NextResponse.json({ error: "shareType required for share events" }, { status: 400 })
        }
        const shareResult = await supabase.from("class_shares").insert({ ...baseData, share_type: shareType })
        error = shareResult.error
        break
      case "view":
        const viewResult = await supabase.from("class_views").insert(baseData)
        error = viewResult.error
        break
      case "attendance_intent":
        if (!intent) {
          return NextResponse.json({ error: "intent required for attendance_intent events" }, { status: 400 })
        }
        const intentResult = await supabase.from("class_attendance_intent").insert({ ...baseData, intent })
        error = intentResult.error
        break
      case "poll_browsing":
      case "poll_interested":
      case "poll_planning":
        // Store poll responses in class_interests table with poll_type field
        const pollResult = await supabase.from("class_interests").insert({ 
          ...baseData, 
          poll_type: eventType 
        })
        error = pollResult.error
        break
      default:
        // Fall back to general class_analytics table for other events
        const analyticsResult = await supabase.from("class_analytics").insert({
          ...baseData,
          category: category || null,
          archetype: archetype || null,
          event_type: eventType,
        })
        error = analyticsResult.error
    }

    if (error) {
      console.error("[Analytics] Insert error:", error)
      return NextResponse.json({ error: "Failed to track" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[Analytics] Error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
