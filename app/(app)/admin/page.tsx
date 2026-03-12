import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminClient } from "./admin-client"

interface Props {
  searchParams: Promise<{ editTags?: string }>
}

export default async function AdminPage({ searchParams }: Props) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect("/classes")
  }

  const editTagsClassId = params.editTags ? parseInt(params.editTags, 10) : undefined

  return <AdminClient initialEditTagsClassId={editTagsClassId} />
}
