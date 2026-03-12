import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
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

    // Get top clicked classes (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: topClasses } = await supabase
      .from("class_analytics")
      .select("class_id, classes(class_name)")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .eq("event_type", "click")

    // Count clicks per class
    const classClickCounts: Record<number, { name: string; count: number }> = {}
    topClasses?.forEach((row: { class_id: number; classes: { class_name: string } | null }) => {
      if (row.class_id) {
        if (!classClickCounts[row.class_id]) {
          classClickCounts[row.class_id] = {
            name: row.classes?.class_name || "Unknown",
            count: 0,
          }
        }
        classClickCounts[row.class_id].count++
      }
    })

    const topClassesList = Object.entries(classClickCounts)
      .map(([id, data]) => ({ classId: Number(id), ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get top categories/archetypes
    const { data: categoryData } = await supabase
      .from("class_analytics")
      .select("archetype")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .eq("event_type", "click")
      .not("archetype", "is", null)

    const archetypeCounts: Record<string, number> = {}
    categoryData?.forEach((row: { archetype: string | null }) => {
      if (row.archetype) {
        archetypeCounts[row.archetype] = (archetypeCounts[row.archetype] || 0) + 1
      }
    })

    const topArchetypes = Object.entries(archetypeCounts)
      .map(([archetype, count]) => ({ archetype, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get total clicks
    const { count: totalClicks } = await supabase
      .from("class_analytics")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString())

    return NextResponse.json({
      topClasses: topClassesList,
      topArchetypes,
      totalClicks: totalClicks || 0,
    })
  } catch (err) {
    console.error("[Admin Analytics] Error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
