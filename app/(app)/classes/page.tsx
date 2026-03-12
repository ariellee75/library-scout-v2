import { createClient } from "@/lib/supabase/server"
import { ClassesClient } from "./classes-client"

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search: initialSearch } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch all classes in batches (Supabase default limit is 1000 rows)
  const batchSize = 1000
  let allClasses: typeof classes = []
  let from = 0
  
  while (true) {
    const { data: batch } = await supabase
      .from("classes")
      .select("*")
      .order("id", { ascending: true })
      .range(from, from + batchSize - 1)
    
    if (!batch || batch.length === 0) break
    allClasses = [...allClasses, ...batch]
    if (batch.length < batchSize) break
    from += batchSize
  }
  
  const classes = allClasses

  // Fetch user's saved class IDs, interests, archetypes, time prefs, and admin status
  let savedIds: number[] = []
  let userInterests: string[] = []
  let userArchetypes: string[] = []
  let userTimePrefs: string[] = []
  let isAdmin = false

  if (user) {
    const [savedRes, interestsRes, archetypesRes, timeRes, profileRes] = await Promise.all([
      supabase.from("saved_classes").select("class_id").eq("user_id", user.id),
      supabase.from("user_interests").select("interest").eq("user_id", user.id),
      supabase.from("user_archetypes").select("archetype").eq("user_id", user.id),
      supabase.from("user_time_prefs").select("time_pref").eq("user_id", user.id),
      supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
    ])

    savedIds = savedRes.data?.map((s) => s.class_id) || []
    userInterests = interestsRes.data?.map((i) => i.interest) || []
    userArchetypes = archetypesRes.data?.map((a) => a.archetype) || []
    userTimePrefs = timeRes.data?.map((t) => t.time_pref) || []
    isAdmin = profileRes.data?.is_admin === true
  }

  return (
    <ClassesClient
      initialClasses={classes || []}
      initialSavedIds={savedIds}
      userInterests={userInterests}
      userArchetypes={userArchetypes}
      userTimePrefs={userTimePrefs}
      userId={user?.id || null}
      initialSearch={initialSearch || ""}
      isAdmin={isAdmin}
    />
  )
}
