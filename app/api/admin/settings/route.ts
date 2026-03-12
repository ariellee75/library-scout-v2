import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Check if user is admin
async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, supabase }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()
  
  return { authorized: profile?.is_admin === true, supabase }
}

// GET: Fetch all app settings
export async function GET() {
  const { authorized, supabase } = await isAdmin()
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("app_settings")
    .select("*")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Convert array to object for easier access
  const settings: Record<string, boolean> = {}
  data?.forEach((row) => {
    settings[row.key] = row.value === true
  })

  return NextResponse.json({ settings })
}

// POST: Update a setting
export async function POST(req: Request) {
  const { authorized, supabase } = await isAdmin()
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { key, value } = await req.json()

  if (!key || typeof value !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { error } = await supabase
    .from("app_settings")
    .upsert({ 
      key, 
      value, 
      updated_at: new Date().toISOString() 
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
