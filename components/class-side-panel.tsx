"use client"

import { useState, useEffect, useMemo } from "react"
import {
  LibraryClass,
  REPORT_REASONS,
  FEEDBACK_MAX_CHARS,
  MAIN_CATEGORIES,
  ARCHETYPES,
  TIME_PREFS,
  type Feedback,
} from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Star,
  Flag,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  MessageSquare,
  Info,
  X,
  User,
  Megaphone,
  List,
  CalendarDays,
  Settings,
  Trash2,
  Share2,
  Link2,
  Check,
  ArrowUpRight,
  Sparkles,
  Tags,
} from "lucide-react"
import { LocationLink } from "@/components/location-link"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { downloadIcs } from "@/lib/ics-helper"
import { getArchetypeStyle } from "@/lib/archetype-styles"
import Link from "next/link"
import Image from "next/image"
import { LibraryScoutCard, type AttendedClassInfo } from "@/components/library-scout-card"

/* ================================================================
   Props
   ================================================================ */

export interface ClassSidePanelProps {
  detailOpen: boolean
  savedOpen: boolean
  profileOpen: boolean
  onDetailClose: () => void
  onSavedToggle: () => void
  onProfileToggle: () => void
  selectedClass: LibraryClass | null
  onSelectClass: (cls: LibraryClass) => void
  savedIds: number[]
  allClasses: LibraryClass[]
  onToggleSave: (classId: number) => void
  userId: string | null
  savedIconRef?: React.RefObject<HTMLButtonElement | null>
  isAdmin?: boolean
}

/* ================================================================
   Icon Bar (always on far right edge)
   ================================================================ */
function IconBar({
  savedOpen,
  profileOpen,
  onSavedToggle,
  onProfileToggle,
  savedCount,
  savedIconRef,
}: {
  savedOpen: boolean
  profileOpen: boolean
  onSavedToggle: () => void
  onProfileToggle: () => void
  savedCount: number
  savedIconRef?: React.RefObject<HTMLButtonElement | null>
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full flex-col items-center gap-1 border-l border-border bg-card py-4 px-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={savedIconRef}
              type="button"
              onClick={onSavedToggle}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                savedOpen
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Bookmark className="h-4 w-4" />
              {savedCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {savedCount > 99 ? "99+" : savedCount}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Saved Classes</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onProfileToggle}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                profileOpen
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <User className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Profile</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfMRQUnHZOPJKwJDQCAg3P3Iz2pls4o7dX4eXuPxA-vRlfBoA/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Megaphone className="h-5 w-5" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="left">Feedback</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

/* ================================================================
   Detail View (class details, feedback, report)
   ================================================================ */
function DetailView({
  classItem,
  isSaved,
  onToggleSave,
  userId,
  onClose,
  isAdmin = false,
  onStaffPickToggle,
}: {
  classItem: LibraryClass
  isSaved: boolean
  onToggleSave: (classId: number) => void
  userId: string | null
  onClose: () => void
  isAdmin?: boolean
  onStaffPickToggle?: (classId: number, isStaffPick: boolean) => void
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [publicFeedback, setPublicFeedback] = useState<Feedback[]>([])
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [attended, setAttended] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDetails, setReportDetails] = useState("")
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Quick intent poll state (works for everyone)
  const [pollSelection, setPollSelection] = useState<string | null>(null)
  const [pollLoading, setPollLoading] = useState(false)

  useEffect(() => {
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
  }, [classItem.id])

  const charsLeft = FEEDBACK_MAX_CHARS - comment.length

  function handleAddToCalendar() {
    if (!userId) {
      toast("Sign in to add events to your calendar.")
      return
    }
    downloadIcs(classItem)
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
          classId: classItem.id, 
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
    if (!userId) { toast.error("Please sign in to leave feedback."); return }
    if (!attended) { toast.error("Please confirm you attended this class first."); return }
    if (rating === 0) { toast.error("Please select a rating."); return }
    if (comment.length > FEEDBACK_MAX_CHARS) { toast.error(`Comment must be under ${FEEDBACK_MAX_CHARS} characters.`); return }
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from("feedback").upsert(
      { user_id: userId, class_id: classItem.id, rating, comment },
      { onConflict: "user_id,class_id" }
    )
    setSubmitting(false)
    if (error) { toast.error("Failed to submit feedback.") } else {
      toast.success("Feedback submitted!")
      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ className: classItem.class_name, rating, comment, userEmail: userId }),
      }).catch(() => {})
      setPublicFeedback((prev) => [
        { id: Date.now(), user_id: userId, class_id: classItem.id, rating, comment, created_at: new Date().toISOString(), profiles: null },
        ...prev.filter((f) => f.user_id !== userId),
      ])
      setRating(0); setComment(""); setAttended(false)
    }
  }

  async function handleSubmitReport() {
    if (!userId) { toast.error("Please sign in to report an issue."); return }
    if (!reportReason) { toast.error("Please select a reason."); return }
    setReportSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from("reports").insert({ user_id: userId, class_id: classItem.id, reason: reportReason, details: reportDetails })
    setReportSubmitting(false)
    if (error) { toast.error("Failed to submit report.") } else {
      toast.success("Report submitted. Thank you!")
      setShowReport(false); setReportReason(""); setReportDetails("")
    }
  }

  const archStyle = getArchetypeStyle(classItem.archetype)
  const ArchIcon = archStyle.icon

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      {/* Header with actions */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close detail"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleSave(classItem.id)}
            className={cn("h-8 w-8", isSaved && "text-primary")}
            title={isSaved ? "Saved" : "Save class"}
          >
            {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleAddToCalendar} className="h-8 w-8" title="Add to calendar">
            <CalendarPlus className="h-4 w-4" />
          </Button>
          
          {/* Share dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Share">
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  const url = `${window.location.origin}/classes?classId=${classItem.id}`
                  navigator.clipboard.writeText(url)
                  setCopied(true)
                  toast.success("Link copied to clipboard!")
                  setTimeout(() => setCopied(false), 2000)
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
                }}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                </svg>
                Text Message
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {classItem.link && (
            <Button asChild size="sm" className="ml-2 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              <a href={classItem.link} target="_blank" rel="noopener noreferrer">
                View on NYPL
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>

{/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {/* Sign up prompt for logged-out users after poll */}
          {!userId && pollSelection && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start justify-between">
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

          {/* Category breadcrumb */}
          <p className="text-xs text-muted-foreground">
            {classItem.main_category}
            {classItem.sub_category ? ` / ${classItem.sub_category}` : ""}
          </p>

          {/* Title */}
          <div className="flex items-start gap-2">
            <h2 className="text-xl font-bold leading-tight text-foreground font-serif">
              {classItem.class_name}
            </h2>
            {classItem.is_staff_pick && (
              <Image
                src="/images/gold-star.png"
                alt="Staff Pick"
                width={24}
                height={24}
                className="h-6 w-6 shrink-0 object-contain"
              />
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {classItem.archetype && (
              <Badge
                className="text-xs gap-1 border-transparent"
                style={{ backgroundColor: archStyle.badgeBg, color: archStyle.badgeText }}
              >
                <ArchIcon className="h-3 w-3" />
                {classItem.archetype}
              </Badge>
            )}
            {classItem.is_staff_pick && (
              <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs gap-1">
                <Star className="h-3 w-3 fill-amber-400" />
                Featured
              </Badge>
            )}
            {classItem.format && classItem.format !== "Unknown" && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {classItem.format}
              </Badge>
            )}
          </div>

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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {classItem.date && (
              <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                <CalendarIcon className="h-4 w-4 shrink-0" />
                {classItem.date}
              </span>
            )}
            {classItem.time && (
              <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                <Clock className="h-4 w-4 shrink-0" />
                {classItem.time}
              </span>
            )}
            {classItem.location && classItem.location !== "Unknown" && (
              <LocationLink location={classItem.location} />
            )}
          </div>

          {/* Description -- moved above disclaimer */}
          <p className="text-sm leading-relaxed text-foreground">
            {classItem.description}
          </p>

          {/* Quick Intent Poll (works for everyone) */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs sm:text-sm font-medium text-foreground mb-2">Thinking of going?</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={pollSelection === "poll_browsing" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePollSubmit("poll_browsing")}
                disabled={pollLoading || pollSelection !== null}
                className="text-xs gap-1.5"
              >
                <span>{"👀"}</span>
                Browsing
              </Button>
              <Button
                variant={pollSelection === "poll_interested" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePollSubmit("poll_interested")}
                disabled={pollLoading || pollSelection !== null}
                className="text-xs gap-1.5"
              >
                <span>{"👍"}</span>
                Interested
              </Button>
              <Button
                variant={pollSelection === "poll_planning" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePollSubmit("poll_planning")}
                disabled={pollLoading || pollSelection !== null}
                className="text-xs gap-1.5"
              >
                <span>{"📅"}</span>
                Going
              </Button>
            </div>
          </div>

          {/* Community Feedback */}
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
              <p className="text-xs text-muted-foreground">No feedback yet. Be the first to share your thoughts!</p>
            ) : (
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto">
                {publicFeedback.map((fb) => (
                  <div key={fb.id} className="rounded-lg bg-muted/50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("h-3 w-3", s <= fb.rating ? "fill-[hsl(35,80%,56%)] text-[hsl(35,80%,56%)]" : "text-border")} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {fb.profiles?.username || "Anonymous"}
                        {fb.user_id === userId && <span className="text-primary"> (you)</span>}
                      </span>
                    </div>
                    {fb.comment && <p className="text-xs leading-relaxed text-foreground">{fb.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave Feedback */}
          <div className="border-t border-border pt-4">
            <h4 className="mb-2 text-sm font-semibold text-foreground">Leave Feedback</h4>
            {!userId ? (
              <p className="text-sm text-muted-foreground">
                Please <a href="/auth/login" className="text-primary underline">sign in</a> to leave feedback.
              </p>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <Switch id="attended-detail" checked={attended} onCheckedChange={setAttended} />
                  <Label htmlFor="attended-detail" className="text-sm text-foreground cursor-pointer">I attended this class</Label>
                </div>
                {!attended ? (
                  <p className="text-xs text-muted-foreground">Please confirm you attended this class to unlock the rating.</p>
                ) : (
                  <>
                    <div className="mb-3 flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setRating(star)} className="transition-transform hover:scale-110" aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}>
                          <Star className={cn("h-5 w-5", star <= rating ? "fill-[hsl(35,80%,56%)] text-[hsl(35,80%,56%)]" : "text-border")} />
                        </button>
                      ))}
                    </div>
                    <Textarea placeholder="Share your thoughts..." value={comment} onChange={(e) => { if (e.target.value.length <= FEEDBACK_MAX_CHARS) setComment(e.target.value) }} className="mb-1 bg-background" rows={2} />
                    <div className="mb-3 flex items-center justify-between">
                      <p className={cn("text-xs", charsLeft < 50 ? "text-[hsl(0,84%,60%)]" : "text-muted-foreground")}>{charsLeft} characters remaining</p>
                    </div>
                    <Button onClick={handleSubmitFeedback} disabled={submitting || rating === 0} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {submitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Report -- moved below feedback, near bottom */}
          <div className="border-t border-border pt-4">
            <button type="button" onClick={() => setShowReport(!showReport)} className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span className="flex items-center gap-2"><Flag className="h-4 w-4" />Report an inaccuracy</span>
              {showReport ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showReport && (
              <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4">
                {!userId ? (
                  <p className="text-sm text-muted-foreground">Please <a href="/auth/login" className="text-primary underline">sign in</a> to report.</p>
                ) : (
                  <>
                    <Select value={reportReason} onValueChange={setReportReason}>
                      <SelectTrigger className="bg-background"><SelectValue placeholder="Select a reason..." /></SelectTrigger>
                      <SelectContent>{REPORT_REASONS.map((reason) => (<SelectItem key={reason} value={reason}>{reason}</SelectItem>))}</SelectContent>
                    </Select>
                    <Textarea placeholder="Details (optional)..." value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} className="bg-background" rows={2} />
                    <Button onClick={handleSubmitReport} disabled={reportSubmitting || !reportReason} size="sm" variant="outline" className="w-fit gap-2 bg-transparent">
                      <Flag className="h-3.5 w-3.5" />{reportSubmitting ? "Submitting..." : "Submit Report"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Disclaimer -- at the very bottom */}
          <div className="flex items-start gap-2.5 rounded-lg border border-[hsl(var(--primary)/0.3)] bg-primary/5 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-foreground">
              This listing is manually maintained. Please verify dates and
              availability directly with the library.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   Date utilities
   ================================================================ */
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Parse class date strings like "Sun, March 1" -- append current year if missing */
function parseClassDate(dateStr: string): Date | null {
  if (!dateStr) return null
  let d = new Date(dateStr)
  // If year is wrong (defaults to 2001 for strings like "Sun, March 1"), fix it
  if (!isNaN(d.getTime()) && d.getFullYear() < 2020) {
    d = new Date(`${dateStr}, ${new Date().getFullYear()}`)
  }
  // Still bad? try appending year directly
  if (isNaN(d.getTime())) {
    d = new Date(`${dateStr} ${new Date().getFullYear()}`)
  }
  return isNaN(d.getTime()) ? null : d
}

/* ================================================================
   Week Navigator -- week view with left/right navigation
   Defaults to first week that has saved content.
   ================================================================ */

function WeekNavigator({
  savedClasses,
  selectedDate,
  onSelectDate,
}: {
  savedClasses: LibraryClass[]
  selectedDate: string | null
  onSelectDate: (dateStr: string | null) => void
}) {
  const now = new Date()
  const todayStr = toDateStr(now)

  // Build date -> count map from saved classes
  const dateCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const cls of savedClasses) {
      if (cls.date) {
        const d = parseClassDate(cls.date)
        if (d) {
          const key = toDateStr(d)
          map[key] = (map[key] || 0) + 1
        }
      }
    }
    return map
  }, [savedClasses])

  // Find the first date that has content to default the week
  const firstContentDate = useMemo(() => {
    const dates = Object.keys(dateCountMap).sort()
    return dates.length > 0 ? new Date(dates[0] + "T12:00:00") : now
  }, [dateCountMap])

  // Week offset: 0 = week containing first content date
  const [weekOffset, setWeekOffset] = useState(0)

  // Compute the start of the displayed week
  const weekStart = useMemo(() => {
    const base = new Date(firstContentDate)
    const dow = base.getDay()
    base.setDate(base.getDate() - dow + weekOffset * 7)
    base.setHours(0, 0, 0, 0)
    return base
  }, [firstContentDate, weekOffset])

  // Build week days array
  const dayLabels = ["Su", "M", "T", "W", "Th", "F", "S"]
  const weekDays = useMemo(() => {
    const days: { label: string; ds: string; day: number; isToday: boolean; monthLabel: string }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      const ds = toDateStr(d)
      days.push({
        label: dayLabels[i],
        ds,
        day: d.getDate(),
        isToday: ds === todayStr,
        monthLabel: d.toLocaleDateString("en-US", { month: "short" }),
      })
    }
    return days
  }, [weekStart, todayStr])

  // Week range label
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const rangeLabel = `${weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { day: "numeric" })}`
  const monthLabel = weekStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    <div className="flex flex-col gap-3">
      {/* Month + range header with nav arrows */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setWeekOffset((w) => w - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-xs font-bold text-foreground">{monthLabel}</p>
          <p className="text-[10px] text-muted-foreground">{rangeLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => setWeekOffset((w) => w + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Week day cells */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((wd) => {
          const count = dateCountMap[wd.ds] || 0
          const isSelected = wd.ds === selectedDate
          const dotCount = Math.min(count, 3)

          return (
            <button
              key={wd.ds}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : wd.ds)}
              className="flex flex-col items-center gap-0.5"
            >
              <span className={cn(
                "text-[10px] font-medium",
                wd.isToday ? "text-primary" : "text-muted-foreground"
              )}>{wd.label}</span>
              <span className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground font-bold"
                  : wd.isToday
                    ? "ring-2 ring-primary font-semibold text-primary"
                    : count > 0
                      ? "font-medium text-foreground hover:bg-muted"
                      : "text-muted-foreground hover:bg-muted"
              )}>
                {wd.day}
              </span>
              {/* Dots for content */}
              <span className="flex items-center justify-center gap-0.5 h-2">
                {dotCount > 0 ? (
                  Array.from({ length: dotCount }).map((_, di) => (
                    <span
                      key={di}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isSelected ? "bg-primary-foreground" : "bg-primary"
                      )}
                    />
                  ))
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ================================================================
   Saved View (calendar + list toggle)
   ================================================================ */
function SavedView({
  savedIds,
  allClasses,
  onToggleSave,
  onOpenDetail,
  userId,
}: {
  savedIds: number[]
  allClasses: LibraryClass[]
  onToggleSave: (classId: number) => void
  onOpenDetail: (cls: LibraryClass) => void
  userId: string | null
}) {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // All hooks must be called before any conditional returns
  const savedClasses = useMemo(
    () => allClasses.filter((c) => savedIds.includes(c.id)),
    [savedIds, allClasses]
  )

  // Group by month for list view
  const grouped = useMemo(() => {
    const groups: Record<string, LibraryClass[]> = {}
    for (const cls of savedClasses) {
      let monthKey = "No Date"
      if (cls.date) {
        const d = parseClassDate(cls.date)
        if (d) {
          monthKey = d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
        }
      }
      if (!groups[monthKey]) groups[monthKey] = []
      groups[monthKey].push(cls)
    }
    return Object.entries(groups).sort((a, b) => {
      if (a[0] === "No Date") return 1
      if (b[0] === "No Date") return -1
      return new Date(a[0]).getTime() - new Date(b[0]).getTime()
    })
  }, [savedClasses])

  // Filter classes by selected date for calendar view
  const filteredByDate = useMemo(() => {
    if (!selectedDate) return savedClasses
    return savedClasses.filter((cls) => {
      if (!cls.date) return false
      const d = parseClassDate(cls.date)
      if (!d) return false
      return toDateStr(d) === selectedDate
    })
  }, [savedClasses, selectedDate])

  // If user is not logged in, show sign-in prompt
  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bookmark className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="mb-1 text-sm font-medium text-foreground">Sign in to save classes</p>
        <p className="mb-4 text-xs text-muted-foreground">Create an account to save your favorite classes and access them anytime.</p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign In
        </Link>
      </div>
    )
  }

  if (savedIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bookmark className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="mb-1 text-sm font-medium text-foreground">No saved classes</p>
        <p className="text-xs text-muted-foreground">Tap the bookmark on any class card to save it here.</p>
      </div>
    )
  }

  const MAX_SAVED = 30
  const savedPercent = Math.min((savedIds.length / MAX_SAVED) * 100, 100)
  const isNearLimit = savedIds.length >= 25
  const isAtLimit = savedIds.length >= MAX_SAVED

  return (
    <div className="flex flex-col gap-4">
      {/* Save limit indicator */}
      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Saved Classes</span>
          <span className={cn("font-medium", isAtLimit ? "text-destructive" : isNearLimit ? "text-amber-600" : "text-foreground")}>
            {savedIds.length} / {MAX_SAVED}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div 
            className={cn(
              "h-full rounded-full transition-all",
              isAtLimit ? "bg-destructive" : isNearLimit ? "bg-amber-500" : "bg-primary"
            )}
            style={{ width: `${savedPercent}%` }}
          />
        </div>
        {isAtLimit && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            You&apos;ve reached the limit. Remove classes to save more, or consider{" "}
            <a href="https://donate.nypl.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              donating to support Library Scout
            </a>.
          </p>
        )}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => setViewMode("calendar")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            viewMode === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Calendar
        </button>
        <button
          type="button"
          onClick={() => setViewMode("list")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <List className="h-3.5 w-3.5" />
          List
        </button>
      </div>

      {/* Calendar view with week navigator */}
      {viewMode === "calendar" && (
        <>
          <WeekNavigator
            savedClasses={savedClasses}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          {selectedDate && (
            <p className="text-xs text-muted-foreground">
              Showing classes on {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              <button type="button" onClick={() => setSelectedDate(null)} className="ml-2 text-primary hover:underline">Clear</button>
            </p>
          )}
          <div className="flex flex-col gap-2">
            {filteredByDate.map((cls) => (
              <SavedClassRow key={cls.id} cls={cls} onOpenDetail={onOpenDetail} onToggleSave={onToggleSave} />
            ))}
            {filteredByDate.length === 0 && selectedDate && (
              <p className="py-4 text-center text-xs text-muted-foreground">No saved classes on this date.</p>
            )}
          </div>
        </>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-5">
          {grouped.map(([month, classes]) => (
            <div key={month}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{month}</h4>
              <div className="flex flex-col gap-2">
                {classes.map((cls) => (
                  <SavedClassRow key={cls.id} cls={cls} onOpenDetail={onOpenDetail} onToggleSave={onToggleSave} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* Saved class mini-card row */
function SavedClassRow({
  cls,
  onOpenDetail,
  onToggleSave,
}: {
  cls: LibraryClass
  onOpenDetail: (cls: LibraryClass) => void
  onToggleSave: (classId: number) => void
}) {
  const style = getArchetypeStyle(cls.archetype)
  const ArchIcon = style.icon

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(cls)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenDetail(cls) }}
      className="group relative rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted/50 cursor-pointer"
    >
      {/* Bookmark icon in top-right corner */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleSave(cls.id) }}
        className="absolute right-2 top-2 text-primary hover:text-primary/70 transition-colors"
        aria-label="Remove from saved"
      >
        <BookmarkCheck className="h-4 w-4" />
      </button>

      <div className="pr-6">
        {cls.archetype && (
          <Badge
            className="mb-1.5 text-[10px] gap-0.5 px-1.5 py-0 border-transparent"
            style={{ backgroundColor: style.badgeBg, color: style.badgeText }}
          >
            <ArchIcon className="h-2.5 w-2.5" />
            {cls.archetype}
          </Badge>
        )}
        <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {cls.class_name}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-foreground/70">
          {cls.date && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {cls.date}
            </span>
          )}
          {cls.time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {cls.time}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   Profile View -- full profile management in panel
   ================================================================ */
function ProfileView({ userId }: { userId: string | null }) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [interests, setInterests] = useState<string[]>([])
  const [archetypes, setArchetypes] = useState<string[]>([])
  const [timePrefs, setTimePrefs] = useState<string[]>([])
  const [attendedCount, setAttendedCount] = useState(0)
  const [memberSince, setMemberSince] = useState("")
  const [attendedClasses, setAttendedClasses] = useState<AttendedClassInfo[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    async function load() {
      const supabase = createClient()
      const [profileRes, intRes, archRes, timeRes, feedbackCountRes, feedbackRes, userRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId!).single(),
        supabase.from("user_interests").select("interest").eq("user_id", userId!),
        supabase.from("user_archetypes").select("archetype").eq("user_id", userId!),
        supabase.from("user_time_prefs").select("time_pref").eq("user_id", userId!),
        supabase.from("feedback").select("id", { count: "exact", head: true }).eq("user_id", userId!),
        supabase.from("feedback")
          .select("created_at, rating, comment, classes(id, class_name, date, link)")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false }),
        supabase.auth.getUser(),
      ])
      setUsername(profileRes.data?.username || "")
      setEmail(userRes.data.user?.email || "")
      setInterests(intRes.data?.map((i) => i.interest) || [])
      setArchetypes(archRes.data?.map((a) => a.archetype) || [])
      setTimePrefs(timeRes.data?.map((t) => t.time_pref) || [])
      setAttendedCount(feedbackCountRes.count ?? 0)
      setMemberSince(profileRes.data?.created_at || new Date().toISOString())
      
      // Transform feedback into attended classes
      const classes = feedbackRes.data?.map((f) => ({
        savedAt: f.created_at,
        classId: (f.classes as { id: number; class_name: string; date: string; link: string } | null)?.id || 0,
        className: (f.classes as { id: number; class_name: string; date: string; link: string } | null)?.class_name || "Unknown",
        classDate: (f.classes as { id: number; class_name: string; date: string; link: string } | null)?.date || "",
        link: (f.classes as { id: number; class_name: string; date: string; link: string } | null)?.link || "",
        feedback: f.comment || "",
        rating: f.rating || 0,
      })) || []
      setAttendedClasses(classes)
      
      setLoading(false)
    }
    load()
  }, [userId])

  function toggleIn(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
  }

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("profiles").update({ username }).eq("id", userId)
    await Promise.all([
      supabase.from("user_interests").delete().eq("user_id", userId),
      supabase.from("user_archetypes").delete().eq("user_id", userId),
      supabase.from("user_time_prefs").delete().eq("user_id", userId),
    ])
    const inserts = []
    if (interests.length > 0) inserts.push(supabase.from("user_interests").insert(interests.map((interest) => ({ user_id: userId, interest }))))
    if (archetypes.length > 0) inserts.push(supabase.from("user_archetypes").insert(archetypes.map((archetype) => ({ user_id: userId, archetype }))))
    if (timePrefs.length > 0) inserts.push(supabase.from("user_time_prefs").insert(timePrefs.map((time_pref) => ({ user_id: userId, time_pref }))))
    await Promise.all(inserts)
    setSaving(false)
    toast.success("Profile updated!")
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <User className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="mb-1 text-sm font-medium text-foreground">Not signed in</p>
        <p className="mb-4 text-xs text-muted-foreground">Sign in to view your profile and preferences.</p>
        <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/auth/login">Sign In</Link>
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Library Scout Card */}
      <LibraryScoutCard
        username={username || email.split("@")[0]}
        memberSince={memberSince}
        savedCount={attendedCount}
        attendedClasses={attendedClasses}
      />

      {/* Account */}
      <div className="flex flex-col gap-3">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Settings className="h-3.5 w-3.5" /> Account
        </h4>
        <div>
          <Label htmlFor="panel-email" className="text-xs text-foreground">Email</Label>
          <Input id="panel-email" value={email} disabled className="mt-1 h-8 bg-muted text-xs text-muted-foreground" />
        </div>
        <div>
          <Label htmlFor="panel-username" className="text-xs text-foreground">Username</Label>
          <Input id="panel-username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 h-8 bg-background text-xs" />
        </div>
      </div>

      {/* Topic Interests */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Topic Interests</h4>
        <div className="flex flex-wrap gap-1.5">
          {MAIN_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setInterests(toggleIn(interests, cat.value))}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors",
                interests.includes(cat.value)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat.value}
            </button>
          ))}
        </div>
      </div>

      {/* Archetypes */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Archetypes</h4>
        <div className="flex flex-wrap gap-1.5">
          {ARCHETYPES.map((arch) => (
            <button
              key={arch.value}
              type="button"
              onClick={() => setArchetypes(toggleIn(archetypes, arch.value))}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors",
                archetypes.includes(arch.value)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {arch.value}
            </button>
          ))}
        </div>
      </div>

      {/* Time prefs */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preferred Times</h4>
        <div className="flex flex-wrap gap-1.5">
          {TIME_PREFS.map((pref) => (
            <button
              key={pref.value}
              type="button"
              onClick={() => setTimePrefs(toggleIn(timePrefs, pref.value))}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors",
                timePrefs.includes(pref.value)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {pref.label}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
        {saving ? "Saving..." : "Save Changes"}
      </Button>

      {/* Sign out + Delete account */}
      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.href = "/"
          }}
          className="gap-2"
        >
          Sign Out
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return
            try {
              const res = await fetch("/api/delete-account", { method: "POST" })
              if (res.ok) {
                toast.success("Account deleted.")
                window.location.href = "/"
              } else {
                toast.error("Failed to delete account.")
              }
            } catch {
              toast.error("Failed to delete account.")
            }
          }}
          className="gap-2 text-[hsl(0,84%,60%)] hover:bg-[hsl(0,84%,60%)]/10 hover:text-[hsl(0,84%,60%)]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Account
        </Button>
      </div>
    </div>
  )
}

/* ================================================================
   Main Panel Component
   ================================================================ */
export function ClassSidePanel({
  detailOpen,
  savedOpen,
  profileOpen,
  onDetailClose,
  onSavedToggle,
  onProfileToggle,
  selectedClass,
  onSelectClass,
  savedIds,
  allClasses,
  onToggleSave,
  userId,
  savedIconRef,
  isAdmin = false,
}: ClassSidePanelProps) {
  const secondaryPanel = savedOpen ? "saved" : profileOpen ? "profile" : null
  const [localClasses, setLocalClasses] = useState<Map<number, boolean>>(new Map())

  async function handleStaffPickToggle(classId: number, newValue: boolean) {
    const supabase = createClient()
    const { error } = await supabase
      .from("classes")
      .update({ is_staff_pick: newValue })
      .eq("id", classId)
    
    if (error) {
      toast.error("Failed to update staff pick status")
    } else {
      setLocalClasses(prev => new Map(prev).set(classId, newValue))
      toast.success(newValue ? "Marked as Staff Pick!" : "Removed Staff Pick")
    }
  }

  // Get effective staff pick status (local override or from selectedClass)
  function getEffectiveClass(cls: LibraryClass): LibraryClass {
    if (localClasses.has(cls.id)) {
      return { ...cls, is_staff_pick: localClasses.get(cls.id)! }
    }
    return cls
  }

  return (
    <>
      {/* Desktop panel */}
      <div className="hidden md:flex h-full shrink-0">
        {/* Detail panel */}
        {detailOpen && selectedClass && (
          <div className="w-[400px] shrink-0 animate-in slide-in-from-right-4 duration-200">
            <DetailView
              classItem={getEffectiveClass(selectedClass)}
              isSaved={savedIds.includes(selectedClass.id)}
              onToggleSave={onToggleSave}
              userId={userId}
              onClose={onDetailClose}
              isAdmin={isAdmin}
              onStaffPickToggle={handleStaffPickToggle}
            />
          </div>
        )}

        {/* Secondary panel: Saved or Profile */}
        {secondaryPanel && (
          <div className="flex w-[340px] shrink-0 flex-col border-l border-border bg-card animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                {secondaryPanel === "saved" ? (
                  <>
                    <Bookmark className="h-4 w-4" />
                    Saved Classes ({savedIds.length})
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    Profile
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={secondaryPanel === "saved" ? onSavedToggle : onProfileToggle}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {secondaryPanel === "saved" && (
                <SavedView
                  savedIds={savedIds}
                  allClasses={allClasses}
                  onToggleSave={onToggleSave}
                  onOpenDetail={(cls) => {
                    onSelectClass(cls)
                  }}
                  userId={userId}
                />
              )}
              {secondaryPanel === "profile" && <ProfileView userId={userId} />}
            </div>
          </div>
        )}

        {/* Icon bar */}
        <IconBar
          savedOpen={savedOpen}
          profileOpen={profileOpen}
          onSavedToggle={onSavedToggle}
          onProfileToggle={onProfileToggle}
          savedCount={savedIds.length}
          savedIconRef={savedIconRef}
        />
      </div>

      {/* Mobile: Full-page overlay for Saved */}
      {savedOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Bookmark className="h-4 w-4" />
              Saved Classes ({savedIds.length})
            </h3>
            <button
              type="button"
              onClick={onSavedToggle}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close saved"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-20">
            <SavedView
              savedIds={savedIds}
              allClasses={allClasses}
              onToggleSave={onToggleSave}
              onOpenDetail={(cls) => {
                onSelectClass(cls)
                onSavedToggle()
              }}
              userId={userId}
            />
          </div>
        </div>
      )}

      {/* Mobile: Full-page overlay for Profile */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="h-4 w-4" />
              Profile
            </h3>
            <button
              type="button"
              onClick={onProfileToggle}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close profile"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-20">
            <ProfileView userId={userId} />
          </div>
        </div>
      )}

      {/* Mobile bottom nav bar -- z-[60] to float above full-page overlays */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] flex items-center justify-around border-t border-border bg-card py-2 md:hidden">
        <button
          type="button"
          onClick={() => {
            if (savedOpen) onSavedToggle()
            if (profileOpen) onProfileToggle()
          }}
          className={cn(
            "flex flex-col items-center gap-0.5 px-4 py-1 text-[10px] font-medium transition-colors",
            !savedOpen && !profileOpen ? "text-primary" : "text-muted-foreground"
          )}
        >
          <BookOpen className="h-5 w-5" />
          Discover
        </button>
        <button
          type="button"
          onClick={() => {
            if (profileOpen) onProfileToggle()
            if (!savedOpen) onSavedToggle()
          }}
          className={cn(
            "flex flex-col items-center gap-0.5 px-4 py-1 text-[10px] font-medium transition-colors",
            savedOpen ? "text-primary" : "text-muted-foreground"
          )}
        >
          <div className="relative">
            <Bookmark className="h-5 w-5" />
            {savedIds.length > 0 && (
              <span className="absolute -right-1.5 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                {savedIds.length > 99 ? "99+" : savedIds.length}
              </span>
            )}
          </div>
          Saved
        </button>
        <button
          type="button"
          onClick={() => {
            if (savedOpen) onSavedToggle()
            if (!profileOpen) onProfileToggle()
          }}
          className={cn(
            "flex flex-col items-center gap-0.5 px-4 py-1 text-[10px] font-medium transition-colors",
            profileOpen ? "text-primary" : "text-muted-foreground"
          )}
        >
          <User className="h-5 w-5" />
          Profile
        </button>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSfMRQUnHZOPJKwJDQCAg3P3Iz2pls4o7dX4eXuPxA-vRlfBoA/viewform?usp=publish-editor"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-0.5 px-4 py-1 text-[10px] font-medium text-muted-foreground transition-colors"
        >
          <Megaphone className="h-5 w-5" />
          Feedback
        </a>
      </div>
    </>
  )
}
