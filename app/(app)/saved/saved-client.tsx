"use client"

import { useState } from "react"
import { LibraryClass } from "@/lib/types"
import { ClassCard } from "@/components/class-card"
import { ClassDetailDialog } from "@/components/class-detail-dialog"
import { createClient } from "@/lib/supabase/client"
import { Bookmark } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface SavedClientProps {
  initialSavedClasses: (LibraryClass & { savedId: number })[]
  userId: string
}

export function SavedClient({ initialSavedClasses, userId }: SavedClientProps) {
  const [savedClasses, setSavedClasses] =
    useState<(LibraryClass & { savedId: number })[]>(initialSavedClasses)
  const [selectedClass, setSelectedClass] = useState<LibraryClass | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  async function handleUnsave(classId: number) {
    const supabase = createClient()
    const { error } = await supabase
      .from("saved_classes")
      .delete()
      .eq("user_id", userId)
      .eq("class_id", classId)

    if (error) {
      toast.error("Failed to remove class.")
    } else {
      setSavedClasses((prev) => prev.filter((c) => c.id !== classId))
      toast.success("Class removed from saved list.")
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Bookmark className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-serif text-foreground">Saved</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Your personal list of classes to attend.
        </p>
      </div>

      {savedClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Bookmark className="mb-4 h-10 w-10 text-muted-foreground/50" />
          <p className="mb-2 text-lg font-medium text-foreground">
            No saved classes yet
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Browse classes and save ones you want to attend.
          </p>
          <Link href="/classes">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Browse Classes
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedClasses.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              isSaved={true}
              onToggleSave={handleUnsave}
              onOpenDetail={(item) => {
                setSelectedClass(item)
                setDetailOpen(true)
              }}
              userId={userId}
            />
          ))}
        </div>
      )}

      <ClassDetailDialog
        classItem={selectedClass}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isSaved={true}
        onToggleSave={
          selectedClass ? () => handleUnsave(selectedClass.id) : undefined
        }
        userId={userId}
      />
    </div>
  )
}
