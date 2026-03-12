"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Profile, MAIN_CATEGORIES, ARCHETYPES, TIME_PREFS } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Settings, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { LibraryScoutCard } from "@/components/library-scout-card"

interface SavedClassInfo {
  savedAt: string
  classId: number
  className: string
  classDate: string
  link: string
}

interface ProfileClientProps {
  profile: Profile | null
  userInterests: string[]
  userArchetypes: string[]
  userTimePrefs: string[]
  savedCount: number
  savedClasses: SavedClassInfo[]
  userId: string
  email: string
}

export function ProfileClient({
  profile,
  userInterests,
  userArchetypes,
  userTimePrefs,
  savedCount,
  savedClasses,
  userId,
  email,
}: ProfileClientProps) {
  const router = useRouter()
  const [username, setUsername] = useState(profile?.username || "")
  const [interests, setInterests] = useState<string[]>(userInterests)
  const [archetypes, setArchetypes] = useState<string[]>(userArchetypes)
  const [timePrefs, setTimePrefs] = useState<string[]>(userTimePrefs)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function toggleIn(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()

    // Update username
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", userId)

    if (profileError) {
      toast.error("Failed to update profile.")
      setSaving(false)
      return
    }

    // Update all 3 preference tables
    await Promise.all([
      supabase.from("user_interests").delete().eq("user_id", userId),
      supabase.from("user_archetypes").delete().eq("user_id", userId),
      supabase.from("user_time_prefs").delete().eq("user_id", userId),
    ])

    const inserts = []
    if (interests.length > 0) {
      inserts.push(
        supabase.from("user_interests").insert(
          interests.map((interest) => ({ user_id: userId, interest }))
        )
      )
    }
    if (archetypes.length > 0) {
      inserts.push(
        supabase.from("user_archetypes").insert(
          archetypes.map((archetype) => ({ user_id: userId, archetype }))
        )
      )
    }
    if (timePrefs.length > 0) {
      inserts.push(
        supabase.from("user_time_prefs").insert(
          timePrefs.map((time_pref) => ({ user_id: userId, time_pref }))
        )
      )
    }

    const results = await Promise.all(inserts)
    const hasError = results.some((r) => r.error)

    setSaving(false)
    if (hasError) {
      toast.error("Failed to update some preferences.")
    } else {
      toast.success("Profile updated!")
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch("/api/delete-account", { method: "POST" })
      if (res.ok) {
        toast.success("Account deleted.")
        router.push("/")
        router.refresh()
      } else {
        toast.error("Failed to delete account.")
      }
    } catch {
      toast.error("Failed to delete account.")
    }
    setDeleting(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Library Scout Card - Hero Section */}
      <div className="mb-8">
        <LibraryScoutCard
          username={username || email.split("@")[0]}
          memberSince={profile?.created_at || new Date().toISOString()}
          savedCount={savedCount}
          savedClasses={savedClasses}
        />
      </div>

      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-lg font-bold font-serif text-foreground">Settings & Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account and customize your recommendations.
        </p>
      </div>

      {/* Account info */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base text-foreground">Account</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Update your profile information.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="mt-1.5 bg-muted text-muted-foreground"
            />
          </div>
          <div>
            <Label htmlFor="username" className="text-foreground">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 bg-background"
            />
          </div>
        </CardContent>
      </Card>

      {/* Topic Interests */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Topic Interests</CardTitle>
          <CardDescription className="text-muted-foreground">
            Choose categories to power your recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {MAIN_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setInterests(toggleIn(interests, cat.value))}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  interests.includes(cat.value)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cat.value}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Archetypes */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Your Archetypes</CardTitle>
          <CardDescription className="text-muted-foreground">
            What kind of learner are you? Select all that apply.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {ARCHETYPES.map((arch) => {
              const isSelected = archetypes.includes(arch.value)
              return (
                <button
                  key={arch.value}
                  type="button"
                  onClick={() => setArchetypes(toggleIn(archetypes, arch.value))}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <div className="flex-1">
                    <p className={cn("text-sm font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                      {arch.value}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{arch.description}</p>
                  </div>
                  <div className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    isSelected ? "border-primary bg-primary" : "border-border"
                  )}>
                    {isSelected && (
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Time Preferences */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Preferred Times</CardTitle>
          <CardDescription className="text-muted-foreground">
            When do you like to attend classes?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TIME_PREFS.map((pref) => (
              <button
                key={pref.value}
                type="button"
                onClick={() => setTimePrefs(toggleIn(timePrefs, pref.value))}
                className={cn(
                  "flex flex-col items-center rounded-lg border-2 px-4 py-3 text-center transition-all",
                  timePrefs.includes(pref.value)
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                )}
              >
                <span className="text-sm font-semibold">{pref.label}</span>
                <span className="text-xs">{pref.description}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 text-[hsl(0,84%,60%)] hover:bg-[hsl(0,84%,60%)]/10 hover:text-[hsl(0,84%,60%)]"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. This will permanently delete your
                account and remove all your data including saved classes,
                feedback, and preferences.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-[hsl(0,84%,60%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(0,84%,50%)]"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
