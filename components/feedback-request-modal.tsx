"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, MessageSquare, Heart } from "lucide-react"
import { toast } from "sonner"

interface PastClass {
  id: number
  class_name: string
  date: string
}

interface FeedbackRequestModalProps {
  userId: string | null
}

export function FeedbackRequestModal({ userId }: FeedbackRequestModalProps) {
  const [pastClass, setPastClass] = useState<PastClass | null>(null)
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!userId) return

    async function checkPastClasses() {
      // First check if modal is enabled
      try {
        const settingsRes = await fetch("/api/settings")
        if (settingsRes.ok) {
          const settings = await settingsRes.json()
          if (!settings.feedback_modal_enabled) return
        }
      } catch {
        // Continue if settings fetch fails
      }

      const supabase = createClient()

      // Get yesterday's date
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split("T")[0]

      // Get day before yesterday for range
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0]

      // Get saved classes that happened yesterday or day before
      const { data: savedClasses } = await supabase
        .from("saved_classes")
        .select("class_id, classes(id, class_name, date)")
        .eq("user_id", userId)

      if (!savedClasses || savedClasses.length === 0) return

      // Filter classes that happened in the last 1-2 days
      const pastClasses = savedClasses
        .map((sc) => sc.classes as PastClass | null)
        .filter((c): c is PastClass => {
          if (!c || !c.date) return false
          const classDate = new Date(c.date).toISOString().split("T")[0]
          return classDate >= twoDaysAgoStr && classDate <= yesterdayStr
        })

      if (pastClasses.length === 0) return

      // Check if user already gave feedback for any of these
      const classIds = pastClasses.map((c) => c.id)
      const { data: existingFeedback } = await supabase
        .from("feedback")
        .select("class_id")
        .eq("user_id", userId)
        .in("class_id", classIds)

      const feedbackClassIds = new Set(existingFeedback?.map((f) => f.class_id) || [])
      const classesNeedingFeedback = pastClasses.filter((c) => !feedbackClassIds.has(c.id))

      if (classesNeedingFeedback.length === 0) return

      // Check if we've already asked about this class today
      const classToAsk = classesNeedingFeedback[0]
      const feedbackKey = `feedback_request_${userId}_${classToAsk.id}`
      const lastAsked = localStorage.getItem(feedbackKey)

      if (lastAsked) return // Already asked

      // Mark as asked
      localStorage.setItem(feedbackKey, new Date().toISOString())

      setPastClass(classToAsk)
      setOpen(true)
    }

    // Delay to not block initial render (show after reminder modal)
    const timer = setTimeout(checkPastClasses, 3000)
    return () => clearTimeout(timer)
  }, [userId])

  async function handleSubmit() {
    if (!userId || !pastClass) return

    setSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase.from("feedback").insert({
      user_id: userId,
      class_id: pastClass.id,
      rating: rating || null,
      comment: comment.trim() || null,
    })

    if (error) {
      toast.error("Failed to submit feedback")
    } else {
      toast.success("Thank you for your feedback!")
      setOpen(false)
    }
    setSubmitting(false)
  }

  function handleSkip() {
    setOpen(false)
  }

  if (!pastClass) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            How was your class?
          </DialogTitle>
          <DialogDescription className="text-sm">
            Your feedback helps us reach our goal of{" "}
            <span className="font-semibold text-primary">100,000 library class attendees</span>!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <h4 className="font-medium text-foreground">{pastClass.class_name}</h4>
            <p className="mt-1 text-xs text-muted-foreground">{pastClass.date}</p>
          </div>

          {/* Star Rating */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Rate your experience
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Share your thoughts (optional)
            </label>
            <Textarea
              placeholder="What did you learn? Would you recommend it?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Mission callout */}
          <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3">
            <Heart className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              Every piece of feedback helps other New Yorkers discover amazing library programs. Together, we&apos;re building a community of lifelong learners!
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1.5"
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
