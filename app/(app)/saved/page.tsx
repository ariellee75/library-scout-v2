import { createClient } from "@/lib/supabase/server"
import { SavedClient } from "./saved-client"
import { redirect } from "next/navigation"

export default async function SavedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: saved } = await supabase
    .from("saved_classes")
    .select("*, classes(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const savedClasses =
    saved?.map((s) => ({
      savedId: s.id,
      ...s.classes,
    })) || []

  return <SavedClient initialSavedClasses={savedClasses} userId={user.id} />
}
