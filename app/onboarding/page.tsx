"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Palette,
  PenTool,
  Heart,
  Globe,
  Monitor,
  Archive,
  Languages as LanguagesIcon,
  DollarSign,
  Landmark,
  Home,
  Scale,
  Briefcase,
  Rocket,
  Scissors,
  Users,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { MAIN_CATEGORIES, ARCHETYPES, TIME_PREFS } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const categoryIcons: Record<string, React.ElementType> = {
  "Money & Taxes": DollarSign,
  "Immigration & Citizenship": Landmark,
  "Housing & Tenant Rights": Home,
  "Legal Help & Rights": Scale,
  "Jobs & Careers": Briefcase,
  "Business & Entrepreneurship": Rocket,
  "Technology & Coding": Monitor,
  "Art & Visual Creativity": Palette,
  "Writing & Literature": PenTool,
  "Crafts, Sewing & Fashion": Scissors,
  Languages: LanguagesIcon,
  "Health, Wellness & Movement": Heart,
  "Culture, History & Talks": Globe,
  "Archives, Research & Genealogy": Archive,
  "Family & Caregiving": Users,
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([])
  const [selectedTimePrefs, setSelectedTimePrefs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function toggle(arr: string[], val: string, setter: (v: string[]) => void) {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val])
  }

  async function handleFinish() {
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Please sign in first.")
      router.push("/auth/login")
      return
    }

    // Save category interests
    if (selectedCategories.length > 0) {
      await supabase.from("user_interests").upsert(
        selectedCategories.map((interest) => ({ user_id: user.id, interest })),
        { onConflict: "user_id,interest" }
      )
    }

    // Save archetype preferences
    if (selectedArchetypes.length > 0) {
      await supabase.from("user_archetypes").upsert(
        selectedArchetypes.map((archetype) => ({ user_id: user.id, archetype })),
        { onConflict: "user_id,archetype" }
      )
    }

    // Save time preferences
    if (selectedTimePrefs.length > 0) {
      await supabase.from("user_time_prefs").upsert(
        selectedTimePrefs.map((time_pref) => ({ user_id: user.id, time_pref })),
        { onConflict: "user_id,time_pref" }
      )
    }

    setLoading(false)
    router.push("/classes")
  }

  const steps = [
    {
      title: "What topics interest you?",
      subtitle: "Pick the categories that catch your eye. We'll recommend classes in these areas.",
    },
    {
      title: "What kind of learner are you?",
      subtitle: "Select one or more archetypes that describe what you're looking for.",
    },
    {
      title: "When do you prefer to attend?",
      subtitle: "Choose the time windows that work best for your schedule.",
    },
  ]

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-3xl">
          {/* Progress */}
          <div className="mb-8 flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === step ? "w-12 bg-primary" : i < step ? "w-8 bg-primary/50" : "w-8 bg-border"
                )}
              />
            ))}
          </div>

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-bold font-serif text-foreground text-balance">
              {steps[step].title}
            </h1>
            <p className="text-muted-foreground">
              {steps[step].subtitle}
            </p>
          </div>

          {/* Step 1: Category interests */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {MAIN_CATEGORIES.map((cat) => {
                const Icon = categoryIcons[cat.value] || Globe
                const isSelected = selectedCategories.includes(cat.value)
                return (
                  <Tooltip key={cat.value}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => toggle(selectedCategories, cat.value, setSelectedCategories)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted"
                        )}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-medium leading-tight">{cat.value}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                      {cat.description}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          )}

          {/* Step 2: Archetypes */}
          {step === 1 && (
            <div className="flex flex-col gap-3">
              {ARCHETYPES.map((arch) => {
                const isSelected = selectedArchetypes.includes(arch.value)
                return (
                  <button
                    key={arch.value}
                    type="button"
                    onClick={() => toggle(selectedArchetypes, arch.value, setSelectedArchetypes)}
                    className={cn(
                      "flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/30 hover:bg-muted"
                    )}
                  >
                    <div className="flex-1">
                      <p className={cn(
                        "font-semibold text-sm",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {arch.value}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {arch.description}
                      </p>
                    </div>
                    <div className={cn(
                      "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
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
          )}

          {/* Step 3: Time preferences */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              {TIME_PREFS.map((pref) => {
                const isSelected = selectedTimePrefs.includes(pref.value)
                return (
                  <button
                    key={pref.value}
                    type="button"
                    onClick={() => toggle(selectedTimePrefs, pref.value, setSelectedTimePrefs)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border-2 p-6 text-center transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted"
                    )}
                  >
                    <span className="text-lg font-semibold">{pref.label}</span>
                    <span className="text-xs">{pref.description}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-2 text-muted-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <p className="text-sm text-muted-foreground">
                Step {step + 1} of 3
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push("/classes")}
                className="text-muted-foreground"
              >
                Skip for now
              </Button>
              {step < 2 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={loading}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? "Saving..." : "Start Exploring"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
