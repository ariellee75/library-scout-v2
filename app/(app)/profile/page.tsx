import { createClient } from "@/lib/supabase/server"
import { ProfileClient } from "./profile-client"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [profileRes, interestsRes, archetypesRes, timeRes, savedCountRes, savedClassesRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("user_interests").select("interest").eq("user_id", user.id),
      supabase.from("user_archetypes").select("archetype").eq("user_id", user.id),
      supabase.from("user_time_prefs").select("time_pref").eq("user_id", user.id),
      supabase.from("saved_classes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("saved_classes")
        .select("created_at, classes(id, class_name, date, link)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ])

  // Transform saved classes data for the card
  const savedClasses = savedClassesRes.data?.map((s) => ({
    savedAt: s.created_at,
    classId: (s.classes as { id: number; class_name: string; date: string; link: string } | null)?.id || 0,
    className: (s.classes as { id: number; class_name: string; date: string; link: string } | null)?.class_name || "Unknown",
    classDate: (s.classes as { id: number; class_name: string; date: string; link: string } | null)?.date || "",
    link: (s.classes as { id: number; class_name: string; date: string; link: string } | null)?.link || "",
  })) || []

  return (
    <ProfileClient
      profile={profileRes.data}
      userInterests={interestsRes.data?.map((i) => i.interest) || []}
      userArchetypes={archetypesRes.data?.map((a) => a.archetype) || []}
      userTimePrefs={timeRes.data?.map((t) => t.time_pref) || []}
      savedCount={savedCountRes.count ?? 0}
      savedClasses={savedClasses}
      userId={user.id}
      email={user.email || ""}
    />
  )
}
