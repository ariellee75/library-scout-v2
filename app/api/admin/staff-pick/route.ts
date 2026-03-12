import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Check admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const { classId, isStaffPick } = await request.json()

  if (typeof classId !== "number" || typeof isStaffPick !== "boolean") {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
  }

  const { error } = await supabase
    .from("classes")
    .update({ is_staff_pick: isStaffPick })
    .eq("id", classId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
