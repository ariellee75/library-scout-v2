"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, X, Star } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface AttendedClassInfo {
  savedAt: string
  classId: number
  className: string
  classDate: string
  link: string
  feedback?: string
  rating?: number
}

interface LibraryScoutCardProps {
  username: string
  memberSince: string
  savedCount: number
  attendedClasses?: AttendedClassInfo[]
}

export function LibraryScoutCard({
  username,
  memberSince,
  savedCount,
  attendedClasses = [],
}: LibraryScoutCardProps) {
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedClass, setSelectedClass] = useState<AttendedClassInfo | null>(null)

  // Format the member since date nicely
  const memberDate = new Date(memberSince)
  const formattedDate = memberDate.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })

  // Format date for table display (e.g., "Feb 26")
  function formatShortDate(dateStr: string) {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Format full date for modal
  function formatFullDate(dateStr: string) {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }

  // Sort classes by date
  const sortedClasses = [...attendedClasses].sort((a, b) => {
    const dateA = new Date(a.classDate || a.savedAt).getTime()
    const dateB = new Date(b.classDate || b.savedAt).getTime()
    return sortAsc ? dateA - dateB : dateB - dateA
  })

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-[#f4ede4] shadow-lg">
        {/* Paper texture overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48ZmVDb2xvck1hdHJpeCB0eXBlPSJzYXR1cmF0ZSIgdmFsdWVzPSIwIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4wOCIvPjwvc3ZnPg==')] opacity-60" />

        <div className="relative px-5 py-4">
          {/* Card Title */}
          <h2 className="mb-3 font-serif text-lg font-bold tracking-tight text-[#1f1a14]">
            LIBRARY SCOUT CARD
          </h2>

          {/* Divider line */}
          <div className="mb-3 h-[1px] bg-[#c4b8a8]" />

          {/* User Info */}
          <div className="mb-4">
            <h3 className="font-serif text-xl font-bold text-[#1f1a14]">
              {username || "Scout Member"}
            </h3>
            <p className="mt-0.5 text-xs text-[#5a5044]">
              Member Since: {formattedDate}
            </p>
            <p className="text-xs text-[#5a5044]">
              Classes Attended: {savedCount}
            </p>
          </div>

          {/* Classes Table */}
          {sortedClasses.length > 0 && (
            <div>
              {/* Table Header with Sort */}
              <div className="grid grid-cols-[60px_1fr_60px] border-b-2 border-t-2 border-[#b5a998] py-1.5">
                <button 
                  onClick={() => setSortAsc(!sortAsc)}
                  className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1f1a14] hover:text-[#8b4513]"
                >
                  Date
                  {sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1f1a14]">Class</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1f1a14]">Feedback</span>
              </div>

              {/* Scrollable Table Rows (max 5 visible) */}
              <div className="max-h-[180px] overflow-y-auto">
                {sortedClasses.map((sc, idx) => (
                  <div
                    key={sc.classId || idx}
                    className="grid grid-cols-[60px_1fr_60px] border-b border-[#d8d0c4] py-2"
                  >
                    <span className="text-xs font-medium text-[#1f1a14]">
                      {formatShortDate(sc.classDate || sc.savedAt)}
                    </span>
                    <div className="pr-2">
                      <span className="block text-xs font-semibold text-[#1f1a14] line-clamp-1">
                        {sc.className}
                      </span>
                      {sc.feedback && (
                        <span className="mt-0.5 block text-[11px] italic text-[#9a8b78] line-clamp-1">
                          {sc.feedback}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedClass(sc)}
                      className="text-xs font-medium text-[#c9882c] underline decoration-[#c9882c] underline-offset-2 hover:text-[#a87020]"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sortedClasses.length === 0 && (
            <div className="border-b-2 border-t-2 border-[#b5a998] py-4 text-center">
              <p className="text-xs italic text-[#9a8b78]">
                No classes attended yet. Start exploring!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      <Dialog open={!!selectedClass} onOpenChange={(open) => !open && setSelectedClass(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Class Feedback</DialogTitle>
          </DialogHeader>
          {selectedClass && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedClass.className}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFullDate(selectedClass.classDate || selectedClass.savedAt)}
                </p>
              </div>
              
              {selectedClass.rating && selectedClass.rating > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Rating</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= selectedClass.rating!
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Feedback</p>
                <p className="text-sm text-foreground">
                  {selectedClass.feedback || "No feedback provided."}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
