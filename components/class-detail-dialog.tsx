"use client"

import { LibraryClass, REPORT_REASONS, FEEDBACK_MAX_CHARS, type Feedback } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calendar,
  Clock,
  ExternalLink,
  Flame,
  Bookmark,
  BookmarkCheck,
  Star,
  Flag,
  ChevronDown,
  ChevronUp,
  CalendarPlus,
  MessageSquare,
  Info,
  Share2,
  Link2,
  Check,
  ArrowUpRight,
  Sparkles,
  X,
  Tags,
} from "lucide-react"
import { LocationLink } from "@/components/location-link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { downloadIcs } from "@/lib/ics-helper"
import { getArchetypeStyle } from "@/lib/archetype-styles"

interface ClassDetailDialogProps {
  classItem: LibraryClass | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isSaved?: boolean
  onToggleSave?: (classId: number) => void
  userId?: string | null
  isAdmin?: boolean
  onStaffPickToggle?: (classId: number, isStaffPick: boolean) => void
}

export function ClassDetailDialog({
  classItem,
  open,
  onOpenChange,
  isSaved = false,
  onToggleSave,
  userId,
  isAdmin = false,
  onStaffPickToggle,
}: ClassDetailDialogProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [publicFeedback, setPublicFeedback] = useState<Feedback[]>([])
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [attended, setAttended] = useState(false)

  // Report state
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDetails, setReportDetails] = useState("")
  const [reportSubmitting, setReportSubmitting] = useState(false)
  
  // Share state
  const [copied, setCopied] = useState(false)
  
  // Quick intent poll state (works for everyone - no login required)
  const [pollSelection, setPollSelection] = useState<string | null>(null)
  const [pollLoading, setPollLoading] = useState(false)

  // Load public feedback when dialog opens
  useEffect(() => {
    if (open && classItem) {
      setLoadingFeedback(true)
      setAttended(false)
      setRating(0)
      setComment("")
      setPollSelection(null)
      const supabase = createClient()
      supabase
        .from("feedback")
        .select("*, profiles(username)")
        .eq("class_id", classItem.id)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }) => {
          setPublicFeedback((data as Feedback[]) || [])
          setLoadingFeedback(false)
        })
    }
  }, [open, classItem])

  if (!classItem) return null

  const charsLeft = FEEDBACK_MAX_CHARS - comment.length

  // Helper to track analytics events
  function trackEvent(eventType: string, shareType?: string) {
    const sessionId = localStorage.getItem("ls_session_id") || crypto.randomUUID()
    if (!localStorage.getItem("ls_session_id")) localStorage.setItem("ls_session_id", sessionId)
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId: classItem!.id, eventType, sessionId, shareType }),
    }).catch(() => {})
  }

  function handleAddToCalendar() {
    if (!userId) {
      toast("Sign in to add events to your calendar.")
      return
    }
    downloadIcs(classItem!)
    trackEvent("ics_download")
  }

async function handlePollSubmit(pollType: "poll_browsing" | "poll_interested" | "poll_planning") {
    if (pollSelection === pollType) return
    setPollLoading(true)
    
    let sessionId = localStorage.getItem("ls_session_id")
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      localStorage.setItem("ls_session_id", sessionId)
    }

    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          classId: classItem!.id, 
          eventType: pollType, 
          sessionId 
        }),
      })
      setPollSelection(pollType)
      toast.success("Thanks for letting us know!")
    } catch {
      toast.error("Failed to record your response")
    } finally {
      setPollLoading(false)
    }
  }

  async function handleSubmitFeedback() {
    if (!userId || !classItem) {
      toast.error("Please sign in to leave feedback.")
      return
    }
    if (!attended) {
      toast.error("Please confirm you attended this class first.")
      return
    }
    if (rating === 0) {
      toast.error("Please select a rating.")
      return
    }
    if (comment.length > FEEDBACK_MAX_CHARS) {
      toast.error(`Comment must be under ${FEEDBACK_MAX_CHARS} characters.`)
      return
    }
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from("feedback").upsert(
      {
        user_id: userId,
        class_id: classItem.id,
        rating,
        comment,
      },
      { onConflict: "user_id,class_id" }
    )
    setSubmitting(false)
    if (error) {
      toast.error("Failed to submit feedback.")
    } else {
      toast.success("Feedback submitted!")

      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: classItem.class_name,
          rating,
          comment,
          userEmail: userId,
        }),
      }).catch(() => {})

      setPublicFeedback((prev) => [
        { id: Date.now(), user_id: userId, class_id: classItem.id, rating, comment, created_at: new Date().toISOString(), profiles: null },
        ...prev.filter((f) => f.user_id !== userId),
      ])
      setRating(0)
      setComment("")
      setAttended(false)
    }
  }

  async function handleSubmitReport() {
    if (!userId || !classItem) {
      toast.error("Please sign in to report an issue.")
      return
    }
    if (!reportReason) {
      toast.error("Please select a reason.")
      return
    }
    setReportSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from("reports").insert({
      user_id: userId,
      class_id: classItem.id,
      reason: reportReason,
      details: reportDetails,
    })
    setReportSubmitting(false)
    if (error) {
      toast.error("Failed to submit report.")
    } else {
      toast.success("Report submitted. Thank you!")
      setShowReport(false)
      setReportReason("")
      setReportDetails("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto overflow-x-hidden sm:max-w-lg bg-card text-card-foreground w-[calc(100vw-2rem)] sm:w-full p-3 sm:p-6 max-w-[calc(100vw-2rem)]">
        <DialogHeader className="text-left min-w-0">
          <div className="flex flex-wrap gap-1.5 pb-2">
            {classItem.archetype && (() => {
              const archStyle = getArchetypeStyle(classItem.archetype)
              const ArchIcon = archStyle.icon
              return (
                <Badge
                  className="text-xs gap-1 border-transparent"
                  style={{ backgroundColor: archStyle.badgeBg, color: archStyle.badgeText }}
                >
                  <ArchIcon className="h-3 w-3" />
                  {classItem.archetype}
                </Badge>
              )
            })()}
            {classItem.is_staff_pick && (
              <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs gap-1">
                <Star className="h-3 w-3 fill-amber-400" />
                Featured
              </Badge>
            )}
            {classItem.is_hot && (
              <Badge className="bg-[hsl(0,84%,60%)] text-[hsl(0,0%,100%)] text-xs">
                <Flame className="mr-1 h-3 w-3" />
                Hot
              </Badge>
            )}
            {classItem.format && classItem.format !== "Unknown" && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {classItem.format}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-base sm:text-xl font-bold text-foreground font-serif pr-6 text-left break-words [overflow-wrap:anywhere]">
            {classItem.class_name}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground text-left break-words">
            {classItem.main_category}
            {classItem.sub_category ? ` / ${classItem.sub_category}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:gap-4 pt-2 min-w-0 w-full">
          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              {onStaffPickToggle && (
                <button
                  type="button"
                  onClick={() => onStaffPickToggle(classItem.id, !classItem.is_staff_pick)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    classItem.is_staff_pick
                      ? "border-amber-500 bg-amber-500/10 text-amber-700"
                      : "border-border bg-card text-muted-foreground hover:border-amber-500/50"
                  )}
                >
                  <Star className={cn("h-4 w-4", classItem.is_staff_pick ? "fill-amber-400 text-amber-400" : "")} />
                  {classItem.is_staff_pick ? "Featured" : "Mark as Featured"}
                </button>
              )}
              <a
                href={`/admin?editTags=${classItem.id}`}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <Tags className="h-4 w-4" />
                Edit Tags
              </a>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-col gap-1.5 text-xs sm:text-sm text-muted-foreground text-left">
            {classItem.date && (
              <span className="flex items-start gap-1.5">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5" />
                <span className="break-words">{classItem.date}{classItem.time ? ` at ${classItem.time}` : ""}</span>
              </span>
            )}
            {classItem.location && classItem.location !== "Unknown" && (
              <LocationLink location={classItem.location} />
            )}
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm leading-relaxed text-foreground text-left break-words [overflow-wrap:anywhere]">
            {classItem.description}
          </p>

          {/* Quick Intent Poll (works for everyone - no login required) */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-foreground mb-2 text-left">Thinking of going?</p>
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={pollSelection === "poll_browsing" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePollSubmit("poll_browsing")}
                disabled={pollLoading || pollSelection !== null}
                className="text-[11px] sm:text-xs gap-1 px-2 sm:px-3 h-8"
              >
                <span>{"👀"}</span>
                Browsing
              </Button>
              <Button
                variant={pollSelection === "poll_interested" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePollSubmit("poll_interested")}
                disabled={pollLoading || pollSelection !== null}
                className="text-[11px] sm:text-xs gap-1 px-2 sm:px-3 h-8"
              >
                <span>{"👍"}</span>
                Interested
              </Button>
              <Button
                variant={pollSelection === "poll_planning" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePollSubmit("poll_planning")}
                disabled={pollLoading || pollSelection !== null}
                className="text-[11px] sm:text-xs gap-1 px-2 sm:px-3 h-8"
              >
                <span>{"📅"}</span>
                Going
              </Button>
            </div>
          </div>

          {/* Actions - Icon row with NYPL button */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {/* Icon buttons */}
            <div className="flex items-center gap-0.5 shrink-0">
              {onToggleSave && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleSave(classItem.id)}
                  className={cn(
                    "h-9 w-9",
                    isSaved && "text-primary"
                  )}
                  title={isSaved ? "Saved" : "Save class"}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-5 w-5" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddToCalendar}
                className="h-9 w-9"
                title="Add to calendar"
              >
                <CalendarPlus className="h-5 w-5" />
              </Button>
              
              {/* Share dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    title="Share"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      const url = `${window.location.origin}/classes?classId=${classItem.id}`
                      navigator.clipboard.writeText(url)
                      setCopied(true)
                      toast.success("Link copied to clipboard!")
                      setTimeout(() => setCopied(false), 2000)
                      trackEvent("share", "copy_link")
                    }}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const url = `${window.location.origin}/classes?classId=${classItem.id}`
                      const text = `Check out "${classItem.class_name}" on Library Scout!`
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank")
                      trackEvent("share", "twitter")
                    }}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Share on X
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const url = `${window.location.origin}/classes?classId=${classItem.id}`
                      const text = `Check out "${classItem.class_name}" on Library Scout!`
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, "_blank")
                      trackEvent("share", "facebook")
                    }}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const url = `${window.location.origin}/classes?classId=${classItem.id}`
                      const text = `Check out "${classItem.class_name}" on Library Scout!\n\n${url}`
                      navigator.clipboard.writeText(text)
                      toast.success("Copied! Paste in Instagram DM or Story")
                      trackEvent("share", "instagram")
                    }}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    Share on Instagram
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const url = `${window.location.origin}/classes?classId=${classItem.id}`
                      const subject = `Check out this class on Library Scout`
                      const body = `Hey! I found this class on Library Scout and thought you might be interested:\n\n${classItem.class_name}\n\n${url}`
                      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank")
                      trackEvent("share", "email")
                    }}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    Email
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const url = `${window.location.origin}/classes?classId=${classItem.id}`
                      const text = `Check out "${classItem.class_name}" on Library Scout! ${url}`
                      window.open(`sms:?&body=${encodeURIComponent(text)}`, "_blank")
                      trackEvent("share", "sms")
                    }}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                    </svg>
                    Text Message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* NYPL Button */}
            {classItem.link && (
              <Button asChild size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm">
                <a
                  href={classItem.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("link_click")}
                >
                  View on NYPL
                  <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </a>
              </Button>
            )}
          </div>

          {/* Sign up prompt for logged-out users */}
          {!userId && pollSelection && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Get More with an Account
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setPollSelection(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Bookmark className="h-3.5 w-3.5 text-primary" />
                  Save classes to your personal list
                </li>
                <li className="flex items-center gap-2">
                  <CalendarPlus className="h-3.5 w-3.5 text-primary" />
                  Add classes directly to your calendar
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  Get personalized recommendations
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  Leave reviews and feedback
                </li>
              </ul>
              <Button
                size="sm"
                className="mt-3 w-full"
                onClick={() => window.location.href = "/auth/sign-up"}
              >
                Create Free Account
              </Button>
            </div>
          )}

          {/* Public feedback section */}
          <div className="border-t border-border pt-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquare className="h-4 w-4" />
              Community Feedback
              {publicFeedback.length > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {publicFeedback.length}
                </span>
              )}
            </h4>

            {loadingFeedback ? (
              <p className="text-xs text-muted-foreground">Loading feedback...</p>
            ) : publicFeedback.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No feedback yet. Be the first to share your thoughts!
              </p>
            ) : (
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto">
                {publicFeedback.map((fb) => (
                  <div key={fb.id} className="rounded-lg bg-muted/50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "h-3 w-3",
                              s <= fb.rating
                                ? "fill-[hsl(35,80%,56%)] text-[hsl(35,80%,56%)]"
                                : "text-border"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {fb.profiles?.username || "Anonymous"}{" "}
                        {fb.user_id === userId && (
                          <span className="text-primary">(you)</span>
                        )}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(fb.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {fb.comment && (
                      <p className="text-xs leading-relaxed text-foreground">{fb.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave feedback form (auth-gated) */}
          <div className="border-t border-border pt-4">
            <h4 className="mb-2 text-sm font-semibold text-foreground">
              Leave Feedback
            </h4>
            {!userId ? (
              <p className="text-sm text-muted-foreground">
                Please{" "}
                <a href="/auth/login" className="text-primary underline">
                  sign in
                </a>{" "}
                to leave feedback.
              </p>
            ) : (
              <>
                {/* #8: Attended toggle -- must confirm attendance before stars unlock */}
                <div className="mb-3 flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <Switch
                    id="attended-toggle"
                    checked={attended}
                    onCheckedChange={setAttended}
                  />
                  <Label htmlFor="attended-toggle" className="text-sm text-foreground cursor-pointer">
                    I attended this class
                  </Label>
                </div>

                {!attended ? (
                  <p className="text-xs text-muted-foreground">
                    Please confirm you attended this class to unlock the rating.
                  </p>
                ) : (
                  <>
                    <div className="mb-3 flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110"
                          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={cn(
                              "h-6 w-6",
                              star <= rating
                                ? "fill-[hsl(35,80%,56%)] text-[hsl(35,80%,56%)]"
                                : "text-border"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="relative mb-1">
                      <Textarea
                        placeholder="Share your thoughts about this class..."
                        value={comment}
                        onChange={(e) => {
                          if (e.target.value.length <= FEEDBACK_MAX_CHARS) {
                            setComment(e.target.value)
                          }
                        }}
                        className="bg-background"
                        rows={3}
                      />
                    </div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className={cn(
                        "text-xs",
                        charsLeft < 50 ? "text-[hsl(0,84%,60%)]" : "text-muted-foreground"
                      )}>
                        {charsLeft} characters remaining
                      </p>
                    </div>
                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={submitting || rating === 0}
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {submitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Info banner -- near report at bottom */}
          <div className="flex items-start gap-2.5 rounded-lg border border-[hsl(var(--primary)/0.3)] bg-primary/5 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-foreground">
              This listing is manually maintained. Please verify final dates, times, and availability
              directly with the library before attending.
            </p>
          </div>

          {/* Report Inaccuracy section */}
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setShowReport(!showReport)}
              className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Report an inaccuracy or broken link
              </span>
              {showReport ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showReport && (
              <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4">
                {!userId ? (
                  <p className="text-sm text-muted-foreground">
                    Please{" "}
                    <a href="/auth/login" className="text-primary underline">
                      sign in
                    </a>{" "}
                    to report an issue.
                  </p>
                ) : (
                  <>
                    <Select
                      value={reportReason}
                      onValueChange={setReportReason}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select a reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        {REPORT_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Add any details (optional)..."
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      className="bg-background"
                      rows={2}
                    />
                    <Button
                      onClick={handleSubmitReport}
                      disabled={reportSubmitting || !reportReason}
                      size="sm"
                      variant="outline"
                      className="w-fit gap-2 bg-transparent"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      {reportSubmitting ? "Submitting..." : "Submit Report"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
