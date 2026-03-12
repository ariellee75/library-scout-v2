import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"

// GET: Fetch public app settings (no auth required)
export async function GET(request: Request) {
  // Rate limiting
  const clientId = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`settings:${clientId}`, RATE_LIMITS.stats)
  
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["reminder_modal_enabled", "feedback_modal_enabled"])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Convert array to object
  const settings: Record<string, boolean> = {}
  data?.forEach((row) => {
    settings[row.key] = row.value === true
  })

  return NextResponse.json(settings)
}
