import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse, NextRequest } from "next/server"

// Helper to check if user is admin
async function isAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { authorized: false, supabase, user: null }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  return {
    authorized: profile?.is_admin === true,
    supabase,
    user,
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// DELETE: Remove all classes (and cascade saved_classes, feedback, reports)
export async function DELETE() {
  const { authorized, supabase } = await isAdmin()
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Delete in order: reports, feedback, saved_classes, then classes
  await supabase.from("reports").delete().neq("id", 0)
  await supabase.from("feedback").delete().neq("id", 0)
  await supabase.from("saved_classes").delete().neq("id", 0)
  const { error } = await supabase.from("classes").delete().neq("id", 0)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: "All classes deleted successfully." })
}

// POST: Upload new CSV data
export async function POST(request: NextRequest) {
  const { authorized, supabase } = await isAdmin()
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const csvContent = await file.text()
    const lines = csvContent.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have a header row and at least one data row" },
        { status: 400 }
      )
    }

    // Skip header
    const dataLines = lines.slice(1)

    const classes = dataLines.map((line) => {
      const cols = parseCSVLine(line)
      return {
        class_name: cols[0] || "Unknown",
        description: cols[1] || "",
        date: cols[2] || "",
        time: cols[3] || "",
        link: cols[4] || "",
        archetype: cols[5] || "",
        main_category: cols[6] || "",
        sub_category: cols[7] || "",
        format: cols[8] || "Unknown",
        location: cols[9] || "Unknown",
        is_hot: false,
        save_count: 0,
      }
    })

    // Insert in batches of 50
    let inserted = 0
    const batchSize = 50
    for (let i = 0; i < classes.length; i += batchSize) {
      const batch = classes.slice(i, i + batchSize)
      const { error } = await supabase.from("classes").insert(batch)
      if (error) {
        return NextResponse.json(
          { error: error.message, insertedSoFar: inserted },
          { status: 500 }
        )
      }
      inserted += batch.length
    }

    return NextResponse.json({
      message: `Successfully uploaded ${inserted} classes.`,
      count: inserted,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to process CSV file" },
      { status: 500 }
    )
  }
}

// GET: Get class count, recent reports, classes for staff pick management, and usage stats
export async function GET() {
  const { authorized, supabase } = await isAdmin()
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Calculate date 30 days ago for active users
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

  // Use admin client to count actual auth users (if service role key is available)
  const adminClient = createAdminClient()

  const [
    countResult,
    reportsResult,
    classesResult,
    totalSavesResult,
    totalFeedbackResult,
    profilesResult,
    recentProfilesResult,
    allSavesResult,
    // New analytics tables
    icsDownloadsResult,
    linkClicksResult,
    sharesResult,
    viewsResult,
    interestsResult,
    attendanceIntentResult,
  ] = await Promise.all([
    supabase.from("classes").select("*", { count: "exact", head: true }),
    supabase
      .from("reports")
      .select("*, classes(class_name)")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("classes")
      .select("id, class_name, is_staff_pick, archetype, main_category, sub_category")
      .order("class_name", { ascending: true }),
    // Total saves
    supabase.from("saved_classes").select("*", { count: "exact", head: true }),
    // Total feedback
    supabase.from("feedback").select("*", { count: "exact", head: true }),
    // Total users from profiles table (fallback if no service role key)
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    // Active users (profile updated in last 30 days)
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", thirtyDaysAgoISO),
    // All saves with class_id for most-saved calculation
    supabase.from("saved_classes").select("class_id"),
    // New analytics
    supabase.from("ics_downloads").select("*", { count: "exact", head: true }),
    supabase.from("link_clicks").select("*", { count: "exact", head: true }),
    supabase.from("class_shares").select("share_type"),
    supabase.from("class_views").select("*", { count: "exact", head: true }),
    supabase.from("class_interests").select("*", { count: "exact", head: true }),
    supabase.from("class_attendance_intent").select("intent"),
  ])

  // Try to get actual auth users count if admin client is available
  let totalAuthUsers = profilesResult.count ?? 0
  let recentAuthUsers = recentProfilesResult.count ?? 0
  
  if (adminClient) {
    try {
      const authUsersResult = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      const authUsers = authUsersResult.data?.users || []
      totalAuthUsers = authUsers.length
      recentAuthUsers = authUsers.filter((u) => {
        const createdAt = new Date(u.created_at)
        return createdAt >= thirtyDaysAgo
      }).length
    } catch {
      // Fall back to profiles count if admin API fails
    }
  }

  // Calculate most-saved classes
  const saveCounts: Record<number, number> = {}
  for (const row of (allSavesResult.data || []) as { class_id: number }[]) {
    saveCounts[row.class_id] = (saveCounts[row.class_id] || 0) + 1
  }
  const mostSavedClassIds = Object.entries(saveCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ classId: parseInt(id), saveCount: count }))

  // Get class names for most-saved
  const mostSavedWithNames = mostSavedClassIds.map(({ classId, saveCount }) => {
    const cls = (classesResult.data || []).find((c: { id: number }) => c.id === classId)
    return { classId, saveCount, name: cls?.class_name || "Unknown" }
  })

  // Calculate share breakdown by type
  const sharesByType: Record<string, number> = {}
  for (const row of (sharesResult.data || []) as { share_type: string }[]) {
    sharesByType[row.share_type] = (sharesByType[row.share_type] || 0) + 1
  }

  // Calculate attendance intent breakdown
  const intentCounts: Record<string, number> = {}
  for (const row of (attendanceIntentResult.data || []) as { intent: string }[]) {
    intentCounts[row.intent] = (intentCounts[row.intent] || 0) + 1
  }

  return NextResponse.json({
    classCount: countResult.count ?? 0,
    reports: reportsResult.data ?? [],
    classes: classesResult.data ?? [],
    totalUsers: totalAuthUsers,
    activeUsers: recentAuthUsers,
    totalSaves: totalSavesResult.count ?? 0,
    totalFeedback: totalFeedbackResult.count ?? 0,
    mostSavedClasses: mostSavedWithNames,
    // New analytics
    analytics: {
      icsDownloads: icsDownloadsResult.count ?? 0,
      linkClicks: linkClicksResult.count ?? 0,
      totalShares: sharesResult.data?.length ?? 0,
      sharesByType,
      totalViews: viewsResult.count ?? 0,
      totalInterests: interestsResult.count ?? 0,
      attendanceIntent: intentCounts,
    },
  })
}
