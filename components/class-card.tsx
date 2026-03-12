"use client"

import { LibraryClass } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  ExternalLink,
  CalendarPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { downloadIcs } from "@/lib/ics-helper"
import { toast } from "sonner"
import { getArchetypeStyle } from "@/lib/archetype-styles"
import Image from "next/image"
import { LocationLink } from "@/components/location-link"

interface ClassCardProps {
  classItem: LibraryClass
  isSaved?: boolean
  onToggleSave?: (classId: number) => void
  onOpenDetail?: (classItem: LibraryClass) => void
  userId?: string | null
}

export function ClassCard({
  classItem,
  isSaved = false,
  onToggleSave,
  onOpenDetail,
  userId,
}: ClassCardProps) {
  const style = getArchetypeStyle(classItem.archetype)
  const ArchIcon = style.icon

  function handleAddToCalendar(e: React.MouseEvent) {
    e.stopPropagation()
    if (!userId) {
      toast("Sign in to add events to your calendar.")
      return
    }
    downloadIcs(classItem)
  }

  function handleClick() {
    // Track the click for analytics (fire and forget)
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId: classItem.id,
        category: classItem.category,
        archetype: classItem.archetype,
        eventType: "click",
      }),
    }).catch(() => {}) // Ignore errors silently
    
    onOpenDetail?.(classItem)
  }

  return (
    <Card
      className="group relative flex h-full min-h-0 cursor-pointer flex-col overflow-hidden border border-border bg-card transition-all hover:shadow-md hover:-translate-y-0.5"
      onClick={handleClick}
    >
      {/* Archetype gradient -- soft radial from top-left */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at top left, ${style.gradientColor} 0%, transparent 70%)`,
          opacity: 0.5,
        }}
      />

      <CardContent className="relative z-10 flex min-w-0 flex-1 flex-col p-0">
        {/* Top row: badges + bookmark in top-right */}
        <div className="flex items-start justify-between gap-2 px-3 sm:px-5 pt-3 sm:pt-4 pb-1 sm:pb-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {classItem.archetype && (
              <Badge
                className="text-[10px] sm:text-xs font-medium gap-1 border-transparent px-2 py-0.5"
                style={{ backgroundColor: style.badgeBg, color: style.badgeText }}
              >
                <ArchIcon className="h-3 w-3 shrink-0" />
                <span>{classItem.archetype}</span>
              </Badge>
            )}
            {classItem.format && classItem.format !== "Unknown" && (
              <Badge variant="outline" className="text-[10px] sm:text-xs text-muted-foreground px-2 py-0.5">
                {classItem.format}
              </Badge>
            )}
            {classItem.is_staff_pick && (
              <Image
                src="/images/gold-star.png"
                alt="Featured"
                width={20}
                height={20}
                className="h-4 w-4 sm:h-5 sm:w-5 object-contain"
              />
            )}
          </div>
          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleSave(classItem.id)
              }}
              className="shrink-0 text-primary hover:text-primary/80 transition-colors"
              aria-label={isSaved ? "Remove from saved" : "Save class"}
            >
              {isSaved ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        {/* Title */}
        <div className="px-3 sm:px-5 pb-2 sm:pb-4 text-left">
          <h3 className="text-sm sm:text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
            {classItem.class_name}
          </h3>
          {/* Description */}
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {classItem.description}
          </p>
        </div>

        {/* Date/time + location */}
        <div className="flex flex-col gap-1 sm:gap-2 px-3 sm:px-5 pb-3 sm:pb-5 text-xs sm:text-sm text-muted-foreground text-left">
          {classItem.date && (
            <div className="flex items-start gap-1.5 sm:gap-2 font-medium text-foreground/80">
              <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5" />
              <span className="break-words">
                {classItem.date}
                {classItem.time ? ` \u00B7 ${classItem.time}` : ""}
              </span>
            </div>
          )}
          {classItem.location && classItem.location !== "Unknown" && (
            <LocationLink location={classItem.location} compact />
          )}
        </div>
      </CardContent>

      {/* Action bar - pushed to bottom with mt-auto */}
      <div className="relative z-10 mt-auto flex items-center border-t border-border">
        <button
          type="button"
          onClick={handleAddToCalendar}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Calendar
        </button>
        <div className="h-4 w-px bg-border" />
        <a
          href={classItem.link || "https://www.nypl.org/events/classes"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          NYPL
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </Card>
  )
}
