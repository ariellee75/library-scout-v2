"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Clock, ExternalLink, Bell } from "lucide-react"

interface UpcomingClass {
  id: number
  class_name: string
  date: string
  time: string | null
  location: string | null
  link: string | null
}

interface ClassReminderModalProps {
  userId: string | null
}

export function ClassReminderModal({ userId }: ClassReminderModalProps) {
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!userId) return

    async function checkUpcomingClasses() {
      // First check if modal is enabled
      try {
        const settingsRes = await fetch("/api/settings")
        if (settingsRes.ok) {
          const settings = await settingsRes.json()
          if (!settings.reminder_modal_enabled) return
        }
      } catch {
        // Continue if settings fetch fails
      }

      const supabase = createClient()

      // Get date 2 days from now
      const twoDaysFromNow = new Date()
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
      const targetDate = twoDaysFromNow.toISOString().split("T")[0]

      // Also check 3 days to capture a range
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
      const endDate = threeDaysFromNow.toISOString().split("T")[0]

      // Get saved classes with dates in the next 2-3 days
      const { data: savedClasses } = await supabase
        .from("saved_classes")
        .select("class_id, classes(id, class_name, date, time, location, link)")
        .eq("user_id", userId)

      if (!savedClasses || savedClasses.length === 0) return

      // Filter classes happening in 2-3 days
      const upcoming = savedClasses
        .map((sc) => sc.classes as UpcomingClass | null)
        .filter((c): c is UpcomingClass => {
          if (!c || !c.date) return false
          // Parse class date - handle various formats
          const classDate = new Date(c.date).toISOString().split("T")[0]
          return classDate >= targetDate && classDate <= endDate
        })

      if (upcoming.length === 0) return

      // Check if we've already shown reminder for these classes today
      const reminderKey = `class_reminder_${userId}_${targetDate}`
      const lastShown = localStorage.getItem(reminderKey)
      
      if (lastShown) return // Already shown today

      // Mark as shown
      localStorage.setItem(reminderKey, new Date().toISOString())
      
      setUpcomingClasses(upcoming)
      setOpen(true)
    }

    // Small delay to not block initial render
    const timer = setTimeout(checkUpcomingClasses, 1500)
    return () => clearTimeout(timer)
  }, [userId])

  if (upcomingClasses.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-lg">
            <Bell className="h-5 w-5 text-primary" />
            Upcoming Classes Reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You have {upcomingClasses.length} saved class{upcomingClasses.length > 1 ? "es" : ""} coming up soon! Don&apos;t forget to sign up.
          </p>

          <div className="max-h-[300px] space-y-3 overflow-y-auto">
            {upcomingClasses.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-border bg-muted/30 p-3"
              >
                <h4 className="font-medium text-foreground line-clamp-2">
                  {c.class_name}
                </h4>
                
                <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                  {c.date && (
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>{c.date}</span>
                    </div>
                  )}
                  {c.time && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{c.time}</span>
                    </div>
                  )}
                  {c.location && c.location !== "Unknown" && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">{c.location}</span>
                    </div>
                  )}
                </div>

                {c.link && (
                  <a
                    href={c.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Sign up now
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Dismiss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
