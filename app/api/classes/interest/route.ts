import { createClient } from "@/lib/supabase/server"
import { NextResponse, NextRequest } from "next/server"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`interest:${clientId}`, RATE_LIMITS.analytics)
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    )
  }

  try {
    const { classId, sessionId } = await request.json()

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser()

    // Check if this session/user already expressed interest
    let existingQuery = supabase
      .from("class_interests")
      .select("id")
      .eq("class_id", classId)

    if (user) {
      existingQuery = existingQuery.eq("user_id", user.id)
    } else if (sessionId) {
      existingQuery = existingQuery.eq("session_id", sessionId)
    }

    const { data: existing } = await existingQuery.maybeSingle()

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        alreadyInterested: true,
        message: "You've already expressed interest in this class" 
      })
    }

    // Insert new interest
    const { error } = await supabase
      .from("class_interests")
      .insert({
        class_id: classId,
        session_id: sessionId || null,
        user_id: user?.id || null,
      })

    if (error) {
      console.error("Error tracking interest:", error)
      return NextResponse.json({ error: "Failed to track interest" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      alreadyInterested: false,
      message: "Interest recorded!" 
    })
  } catch (error) {
    console.error("Error in interest API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get interest count for a class
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { count, error } = await supabase
      .from("class_interests")
      .select("*", { count: "exact", head: true })
      .eq("class_id", classId)

    if (error) {
      console.error("Error getting interest count:", error)
      return NextResponse.json({ error: "Failed to get interest count" }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("Error in interest API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
