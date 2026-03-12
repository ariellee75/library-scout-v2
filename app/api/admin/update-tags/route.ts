import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { ARCHETYPE_VALUES, MAIN_CATEGORY_VALUES, SUB_CATEGORY_MAP } from "@/lib/types"

async function isAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { authorized: false, supabase }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()
  return { authorized: profile?.is_admin === true, supabase }
}

// GET: Get all available tags (categories, subcategories, archetypes)
export async function GET() {
  const { authorized } = await isAdmin()
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Get all sub-categories flattened
  const allSubCategories = Object.values(SUB_CATEGORY_MAP).flat()

  return NextResponse.json({
    archetypes: ARCHETYPE_VALUES,
    mainCategories: MAIN_CATEGORY_VALUES,
    subCategories: allSubCategories,
    subCategoryMap: SUB_CATEGORY_MAP,
  })
}

// POST: Update tags for a class
export async function POST(request: Request) {
  const { authorized, supabase } = await isAdmin()
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const { classId, archetype, mainCategory, subCategory } = await request.json()

    if (!classId) {
      return NextResponse.json({ error: "classId is required" }, { status: 400 })
    }

    // Validate values (allow null to clear values)
    if (archetype && !ARCHETYPE_VALUES.includes(archetype)) {
      return NextResponse.json({ error: "Invalid archetype" }, { status: 400 })
    }
    if (mainCategory && !MAIN_CATEGORY_VALUES.includes(mainCategory)) {
      return NextResponse.json({ error: "Invalid main category" }, { status: 400 })
    }
    if (subCategory) {
      const allSubCategories = Object.values(SUB_CATEGORY_MAP).flat()
      if (!allSubCategories.includes(subCategory)) {
        return NextResponse.json({ error: "Invalid sub category" }, { status: 400 })
      }
    }

    // Build update data - allow null values to clear fields
    const updateData: Record<string, string | null> = {}
    if (archetype !== undefined) updateData.archetype = archetype || null
    if (mainCategory !== undefined) updateData.main_category = mainCategory || null
    if (subCategory !== undefined) updateData.sub_category = subCategory || null

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }
    
    console.log("[Admin] Updating class", classId, "with:", updateData)

    const { error } = await supabase
      .from("classes")
      .update(updateData)
      .eq("id", classId)

    if (error) {
      console.error("Error updating class tags:", error)
      return NextResponse.json({ error: "Failed to update tags" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error in update-tags:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
