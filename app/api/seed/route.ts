import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"

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

export async function POST(request: Request) {
  // Rate limiting - strict limit for seed operations
  const clientId = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`seed:${clientId}`, { maxRequests: 2, windowSizeSeconds: 3600 }) // 2 per hour
  
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const supabase = await createClient()
  
  // Admin-only: Check if user is authenticated and is admin
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
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
  }

  // Check if data already exists
  const { count } = await supabase
    .from("classes")
    .select("*", { count: "exact", head: true })

  if (count && count > 0) {
    return NextResponse.json({
      message: `Database already has ${count} classes. Skipping seed.`,
    })
  }

  try {
    const csvPath = path.join(process.cwd(), "scripts", "library-classes.csv")
    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.split("\n").filter((line) => line.trim())

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
    const batchSize = 50
    let inserted = 0
    for (let i = 0; i < classes.length; i += batchSize) {
      const batch = classes.slice(i, i + batchSize)
      const { error } = await supabase.from("classes").insert(batch)
      if (error) {
        console.error("Batch insert error:", error)
        return NextResponse.json(
          { error: error.message, batch: i },
          { status: 500 }
        )
      }
      inserted += batch.length
    }

    return NextResponse.json({
      message: `Successfully seeded ${inserted} classes.`,
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    )
  }
}
