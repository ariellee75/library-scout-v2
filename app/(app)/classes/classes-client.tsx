"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { LibraryClass, TIME_PREFS, DATE_PRESETS, ARCHETYPES, MAIN_CATEGORIES, SUB_CATEGORY_MAP } from "@/lib/types"
import { findLibrary as findLibraryByLocation, BOROUGHS } from "@/lib/nypl-locations"
import { ClassCard } from "@/components/class-card"
import {
  ClassFilters,
  type Filters,
  EMPTY_FILTERS,
  countActiveFilters,
  getActiveFilterLabels,
} from "@/components/class-filters"
import { ClassDetailDialog } from "@/components/class-detail-dialog"
import { ClassSidePanel } from "@/components/class-side-panel"
import { HowItWorksModal } from "@/components/how-it-works-modal"
import { ClassReminderModal } from "@/components/class-reminder-modal"
import { FeedbackRequestModal } from "@/components/feedback-request-modal"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SlidersHorizontal,
  Sparkles,
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Settings2,
  X,
  Bookmark,
  Clock,
  CalendarDays,
  Star,
  ArrowUp,
  MapPin,
} from "lucide-react"
import { toast } from "sonner"
import { matchesDatePreset, matchesTimePreset } from "@/lib/date-helpers"
import { cn } from "@/lib/utils"

// Category chips with images - alphabetically ordered
const CATEGORY_CHIPS = [
  { value: "Archives, Research & Genealogy", label: "Archives, Research & Genealogy", shortLabel: "Archives", image: "/images/categories/archives.png" },
  { value: "Art & Visual Creativity", label: "Art & Visual Creativity", shortLabel: "Art", image: "/images/categories/art-visual.png" },
  { value: "Business & Entrepreneurship", label: "Business & Entrepreneurship", shortLabel: "Business", image: "/images/categories/business.png" },
  { value: "Crafts, Sewing & Fashion", label: "Crafts, Sewing & Fashion", shortLabel: "Crafts", image: "/images/categories/crafts-sewing.png" },
  { value: "Culture, History & Talks", label: "Culture, History & Talks", shortLabel: "Culture", image: "/images/categories/culture-history.png" },
  { value: "Family & Caregiving", label: "Family & Caregiving", shortLabel: "Family", image: "/images/categories/family-caregiving.png" },
  { value: "Health, Wellness & Movement", label: "Health, Wellness & Movement", shortLabel: "Health", image: "/images/categories/health-wellness.png" },
  { value: "Housing & Tenant Rights", label: "Housing & Tenant Rights", shortLabel: "Housing", image: "/images/categories/housing.png" },
  { value: "Immigration & Citizenship", label: "Immigration & Citizenship", shortLabel: "Immigration", image: "/images/categories/immigration.png" },
  { value: "Jobs & Careers", label: "Jobs & Careers", shortLabel: "Jobs", image: "/images/categories/jobs-careers.png" },
  { value: "Languages", label: "Languages", shortLabel: "Languages", image: "/images/categories/languages.png" },
  { value: "Legal Help & Rights", label: "Legal Help & Rights", shortLabel: "Legal", image: "/images/categories/legal-help.png" },
  { value: "Money & Taxes", label: "Money & Taxes", shortLabel: "Money", image: "/images/categories/money-taxes.png" },
  { value: "Music + Sound", label: "Music + Sound", shortLabel: "Music", image: "/images/categories/music-sound.png" },
  { value: "Technology & Coding", label: "Technology & Coding", shortLabel: "Tech", image: "/images/categories/technology.png" },
  { value: "Writing & Literature", label: "Writing & Literature", shortLabel: "Writing", image: "/images/categories/writing.png" },
]

interface ClassesClientProps {
  initialClasses: LibraryClass[]
  initialSavedIds: number[]
  userInterests: string[]
  userArchetypes: string[]
  userTimePrefs: string[]
  userId: string | null
  initialSearch?: string
  isAdmin?: boolean
}

type Tab = "recommended" | "staff_picks" | "all"

export function ClassesClient({
  initialClasses,
  initialSavedIds,
  userInterests,
  userArchetypes,
  userTimePrefs,
  userId,
  initialSearch = "",
  isAdmin = false,
}: ClassesClientProps) {
  const [allClasses, setAllClasses] = useState<LibraryClass[]>(initialClasses)
  const totalCount = allClasses.length

  const [savedIds, setSavedIds] = useState<number[]>(initialSavedIds)
  const [selectedClass, setSelectedClass] = useState<LibraryClass | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)
  const [savedPanelOpen, setSavedPanelOpen] = useState(false)
  const [profilePanelOpen, setProfilePanelOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const savedIconRef = useRef<HTMLButtonElement>(null)
  const [flyAnim, setFlyAnim] = useState<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [filters, setFilters] = useState<Filters>(() => {
    // Restore filters from sessionStorage on mount
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("classFilters")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch { /* ignore */ }
      }
    }
    return EMPTY_FILTERS
  })
  const [searchQuery, setSearchQuery] = useState(() => {
    if (initialSearch) return initialSearch
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("classSearchQuery") || ""
    }
    return ""
  })
  const [bannerOpen, setBannerOpen] = useState(true)
  const [prefModalOpen, setPrefModalOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  // Server-side search results (queries full DB)
  const [dbSearchResults, setDbSearchResults] = useState<LibraryClass[] | null>(null)
  const [dbSearching, setDbSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Pref modal state
  const [editInterests, setEditInterests] = useState<string[]>(userInterests)
  const [editArchetypes, setEditArchetypes] = useState<string[]>(userArchetypes)
  const [editTimePrefs, setEditTimePrefs] = useState<string[]>(userTimePrefs)
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Staff pick toggle handler (for admins)
  async function handleStaffPickToggle(classId: number, newValue: boolean) {
    const supabase = createClient()
    const { error } = await supabase
      .from("classes")
      .update({ is_staff_pick: newValue })
      .eq("id", classId)
    
    if (error) {
      toast.error("Failed to update featured status")
    } else {
      // Update local state
      setAllClasses(prev => prev.map(c => c.id === classId ? { ...c, is_staff_pick: newValue } : c))
      if (selectedClass?.id === classId) {
        setSelectedClass(prev => prev ? { ...prev, is_staff_pick: newValue } : null)
      }
      toast.success(newValue ? "Marked as Featured!" : "Removed from Featured")
    }
  }

  // Live prefs (updated after save) -- filter stale interests not in MAIN_CATEGORIES
  const validCategoryValues = useMemo(() => new Set(MAIN_CATEGORIES.map((c) => c.value)), [])
  const [liveInterests, setLiveInterests] = useState(() =>
    userInterests.filter((i) => validCategoryValues.has(i))
  )
  const [liveArchetypes, setLiveArchetypes] = useState(userArchetypes)
  const [liveTimePrefs, setLiveTimePrefs] = useState(userTimePrefs)

  const hasPrefs =
    liveInterests.length > 0 || liveArchetypes.length > 0 || liveTimePrefs.length > 0

  const [searchOpen, setSearchOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (initialSearch) return "all"
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("classActiveTab") as Tab | null
      if (saved && ["recommended", "staff_picks", "all"].includes(saved)) {
        return saved
      }
    }
    return hasPrefs ? "recommended" : "all"
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(30)
  const PAGE_SIZE_OPTIONS = [15, 30, 50, 100]

  // DB search counts
  const [dbTotalFiltered, setDbTotalFiltered] = useState<number | null>(null)
  const [dbRecCount, setDbRecCount] = useState<number | null>(null)

  // Desktop detection for panel vs dialog
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // Track scroll position for "scroll to top" button
  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 600)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle classId URL param for deep linking (shared class links)
  // Use a ref to track if we've already handled the initial URL
  const urlHandledRef = useRef(false)
  
  useEffect(() => {
    // Only run once on initial load, not on every allClasses change
    if (urlHandledRef.current) return
    
    const params = new URLSearchParams(window.location.search)
    const classId = params.get("classId")
    if (classId && allClasses.length > 0) {
      const classToShow = allClasses.find((c) => c.id === parseInt(classId, 10))
      if (classToShow) {
        setSelectedClass(classToShow)
        setDetailDialogOpen(true)
        urlHandledRef.current = true
        // Clean up URL without triggering navigation
        window.history.replaceState({}, "", window.location.pathname)
      }
    }
  }, [allClasses])

  // Persist filters to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("classFilters", JSON.stringify(filters))
  }, [filters])

  // Persist search query to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("classSearchQuery", searchQuery)
  }, [searchQuery])

  // Persist active tab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("classActiveTab", activeTab)
  }, [activeTab])

  // Reset to page 1 when filters, search, or tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, searchQuery, activeTab])

  // Seed data if empty
  useEffect(() => {
    if (initialClasses.length === 0 && !seeding) {
      setSeeding(true)
      fetch("/api/seed", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          toast.success(data.message || "Data seeded!")
          window.location.reload()
        })
        .catch(() => toast.error("Failed to seed data"))
        .finally(() => setSeeding(false))
    }
  }, [initialClasses.length, seeding])

  // Debounced full-DB search when user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!searchQuery.trim()) {
      setDbSearchResults(null)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setDbSearching(true)
      const supabase = createClient()
      const q = `%${searchQuery.trim()}%`
      const { data } = await supabase
        .from("classes")
        .select("*")
        .or(
          `class_name.ilike.${q},description.ilike.${q},main_category.ilike.${q},sub_category.ilike.${q}`
        )
        .order("id", { ascending: true })
        .limit(200)
      setDbSearchResults(data || [])
      setDbSearching(false)
    }, 300)
  }, [searchQuery])

  // Fetch DB-level counts for tabs whenever filters change
  useEffect(() => {
    async function fetchCounts() {
      const supabase = createClient()
      // Total count with current filters (approximate via full query)
      let query = supabase.from("classes").select("*", { count: "exact", head: true })
      if (filters.hotOnly) query = query.eq("is_hot", true)
      if (filters.mainCategory) query = query.eq("main_category", filters.mainCategory)
      if (filters.subCategory) query = query.eq("sub_category", filters.subCategory)
      if (filters.format) query = query.eq("format", filters.format)
      if (filters.library) query = query.eq("location", filters.library)
      if (filters.archetypes.length > 0)
        query = query.in("archetype", filters.archetypes)

      const { count: allCount } = await query
      setDbTotalFiltered(allCount ?? totalCount)

      // Recommended count -- use local count since DB can't easily combine OR/AND across interest+archetype+time
      if (hasPrefs) {
        setDbRecCount(null) // fall back to local count
      }
    }
    fetchCounts()
  }, [filters, totalCount, hasPrefs, liveInterests, liveArchetypes, liveTimePrefs])

  // Extract unique libraries
  const libraries = useMemo(
    () =>
      Array.from(
        new Set(
          allClasses
            .map((c) => c.location)
            .filter((l) => l && l !== "Unknown")
        )
      ).sort(),
    [allClasses]
  )

  // Apply filters (no search -- search handled separately via DB)
  function applyFilters(classes: LibraryClass[]): LibraryClass[] {
    return classes.filter((c) => {
      if (
        filters.archetypes.length > 0 &&
        !filters.archetypes.includes(c.archetype)
      )
        return false
      if (filters.mainCategory && c.main_category !== filters.mainCategory)
        return false
      if (filters.subCategory && c.sub_category !== filters.subCategory)
        return false
      if (filters.format && c.format !== filters.format) return false
      // Borough filter - check if class location matches a library in the selected borough
      if (filters.borough) {
        const lib = findLibraryByLocation(c.location)
        if (!lib || lib.borough !== filters.borough) return false
      }
      if (filters.library && c.location !== filters.library) return false
      if (
        filters.datePreset &&
        !matchesDatePreset(c.date, filters.datePreset)
      )
        return false
      if (
        filters.timePreset &&
        !matchesTimePreset(c.time, filters.timePreset)
      )
        return false
      if (filters.hotOnly && !c.is_hot) return false
      return true
    })
  }

  // Base set: if search is active, use DB search results; otherwise use loaded classes
  const baseClasses = searchQuery.trim()
    ? dbSearchResults ?? []
    : allClasses

  // Expand interest keys to include their sub-categories for matching
  const expandedInterests = useMemo(() => {
    const expanded = new Set<string>()
    for (const interest of liveInterests) {
      expanded.add(interest.toLowerCase())
      // Also add sub-categories for this interest
      const subs = SUB_CATEGORY_MAP[interest]
      if (subs) {
        for (const sub of subs) expanded.add(sub.toLowerCase())
      }
    }
    return expanded
  }, [liveInterests])

  // Recommended classes -- only match criteria the user actually selected
  const recommendedClasses = useMemo(() => {
    if (!hasPrefs) return []
    const matched = baseClasses.filter((c) => {
      // Only check criteria the user has set. A class must match ALL set criteria.
      if (liveInterests.length > 0) {
        const cat = c.main_category?.toLowerCase() ?? ""
        const sub = c.sub_category?.toLowerCase() ?? ""
        const matchesInterest = expandedInterests.has(cat) || expandedInterests.has(sub)
        if (!matchesInterest) return false
      }
      if (liveArchetypes.length > 0) {
        const matchesArchetype = liveArchetypes.some(
          (arch) => c.archetype?.toLowerCase() === arch.toLowerCase()
        )
        if (!matchesArchetype) return false
      }
      if (liveTimePrefs.length > 0) {
        const matchesTime = liveTimePrefs.some((pref) => matchesTimePreset(c.time, pref))
        if (!matchesTime) return false
      }
      return true
    })
    return applyFilters(matched)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseClasses, liveInterests, liveArchetypes, liveTimePrefs, expandedInterests, filters])

  // All classes filtered
  const allFiltered = useMemo(
    () => applyFilters(baseClasses),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseClasses, filters]
  )

  const staffPicksClasses = useMemo(() => 
    allFiltered.filter((c) => c.is_staff_pick === true),
    [allFiltered]
  )

  const displayedClasses =
    activeTab === "recommended" 
      ? recommendedClasses 
      : activeTab === "staff_picks" 
        ? staffPicksClasses 
        : allFiltered

  // Pagination calculations
  const totalPages = Math.ceil(displayedClasses.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedClasses = displayedClasses.slice(startIndex, endIndex)

  // Generate page numbers for display (show max 7 pages with ellipsis)
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push("ellipsis")
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("ellipsis")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("ellipsis")
        pages.push(totalPages)
      }
    }
    return pages
  }

  // Tab display counts -- prefer DB counts, fall back to local
  const allTabCount = dbTotalFiltered ?? totalCount
  const recTabCount = dbRecCount ?? recommendedClasses.length
  const staffPicksCount = staffPicksClasses.length

  // Build plain english summary
  function buildSummary(): string {
    const parts: string[] = []
    if (liveInterests.length > 0) {
      parts.push(`interested in ${liveInterests.join(", ")}`)
    }
    if (liveArchetypes.length > 0) {
      parts.push(`as a ${liveArchetypes.join(" & ")}`)
    }
    if (liveTimePrefs.length > 0) {
      const labels = liveTimePrefs.map(
        (v) => TIME_PREFS.find((p) => p.value === v)?.label || v
      )
      parts.push(`available during ${labels.join(" or ")}`)
    }
    if (parts.length === 0) return ""
    return `You're ${parts.join(", ")}.`
  }

  const MAX_SAVED_CLASSES = 30

  async function toggleSave(classId: number) {
    if (!userId) {
      toast.error("Please sign in to save classes.")
      return
    }
    const supabase = createClient()
    const isSaved = savedIds.includes(classId)

    if (isSaved) {
      setSavedIds((prev) => prev.filter((id) => id !== classId))
      const { error } = await supabase
        .from("saved_classes")
        .delete()
        .eq("user_id", userId)
        .eq("class_id", classId)
      if (error) {
        setSavedIds((prev) => [...prev, classId])
        toast.error("Failed to unsave class.")
      }
    } else {
      // Check if user has reached the limit
      if (savedIds.length >= MAX_SAVED_CLASSES) {
        toast.error(
          `You've reached the limit of ${MAX_SAVED_CLASSES} saved classes. Please remove some to save more. Consider donating to support Library Scout!`,
          { duration: 5000 }
        )
        return
      }

      setSavedIds((prev) => [...prev, classId])
      const { error } = await supabase
        .from("saved_classes")
        .insert({ user_id: userId, class_id: classId })
      if (error) {
        setSavedIds((prev) => prev.filter((id) => id !== classId))
        toast.error("Failed to save class.")
      } else {
        toast.success("Class saved!")
        // Fly animation: find the card's save button and animate to saved icon
        if (savedIconRef.current) {
          const target = savedIconRef.current.getBoundingClientRect()
          // Use center of viewport as origin fallback
          setFlyAnim({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            tx: target.left + target.width / 2,
            ty: target.top + target.height / 2,
          })
          setTimeout(() => setFlyAnim(null), 700)
        }
      }
    }
  }

  async function handleSavePrefs() {
    if (!userId) return
    setSavingPrefs(true)
    const supabase = createClient()

    await Promise.all([
      supabase.from("user_interests").delete().eq("user_id", userId),
      supabase.from("user_archetypes").delete().eq("user_id", userId),
      supabase.from("user_time_prefs").delete().eq("user_id", userId),
    ])

    const inserts = []
    if (editInterests.length > 0) {
      inserts.push(
        supabase
          .from("user_interests")
          .insert(
            editInterests.map((interest) => ({ user_id: userId, interest }))
          )
      )
    }
    if (editArchetypes.length > 0) {
      inserts.push(
        supabase
          .from("user_archetypes")
          .insert(
            editArchetypes.map((archetype) => ({
              user_id: userId,
              archetype,
            }))
          )
      )
    }
    if (editTimePrefs.length > 0) {
      inserts.push(
        supabase
          .from("user_time_prefs")
          .insert(
            editTimePrefs.map((time_pref) => ({ user_id: userId, time_pref }))
          )
      )
    }
    await Promise.all(inserts)

    setLiveInterests(editInterests)
    setLiveArchetypes(editArchetypes)
    setLiveTimePrefs(editTimePrefs)
    setSavingPrefs(false)
    setPrefModalOpen(false)
    toast.success("Preferences updated!")
  }

  function toggleIn(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
  }

  function removeFilter(key: string) {
    if (key === "hotOnly") {
      setFilters({ ...filters, hotOnly: false })
    } else if (key.startsWith("arch_")) {
      const arch = key.replace("arch_", "")
      setFilters({
        ...filters,
        archetypes: filters.archetypes.filter((a) => a !== arch),
      })
    } else if (key === "datePreset") {
      setFilters({ ...filters, datePreset: "" })
    } else if (key === "timePreset") {
      setFilters({ ...filters, timePreset: "" })
    } else if (key === "mainCategory") {
      setFilters({ ...filters, mainCategory: "", subCategory: "" })
    } else if (key === "subCategory") {
      setFilters({ ...filters, subCategory: "" })
    } else if (key === "format") {
      setFilters({ ...filters, format: "" })
    } else if (key === "library") {
      setFilters({ ...filters, library: "" })
    }
  }

  if (seeding) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">
          Setting up class data for the first time...
        </p>
      </div>
    )
  }

  const filterSidebar = (
    <ClassFilters
      filters={filters}
      onFiltersChange={setFilters}
      allClasses={allClasses}
      libraries={libraries}
      activeCount={displayedClasses.length}
    />
  )

  const summary = buildSummary()
  const activeFilterCount = countActiveFilters(filters)
  const activeFilterLabels = getActiveFilterLabels(filters)

return (
    <div className="flex h-[calc(100dvh-64px)] flex-col overflow-hidden pb-14 md:pb-0">
      {/* ── Sticky Toolbar ─────────────────────────────────── */}
      <div className="z-30 shrink-0 border-b border-border bg-background px-2 sm:px-4 py-2 sm:py-3">
        {/* Row 1: Title + Search icon + Filter */}
        <div className="flex items-center gap-2 min-w-0">
          <Image
            src="/images/compass.png"
            alt=""
            width={24}
            height={24}
            className="h-5 w-5 sm:h-6 sm:w-6 object-contain shrink-0"
          />
          <h1 className="text-sm sm:text-lg font-bold font-serif text-foreground">
            Discover
          </h1>

          {/* Search icon -- close to title */}
          <button
            type="button"
            onClick={() => setSearchOpen((p) => !p)}
            className={cn(
              "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md transition-colors shrink-0",
              searchOpen || searchQuery
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-label="Toggle search"
          >
            <Search className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" />
          </button>

          <div className="flex-1" />

          {/* Filter toggle */}
          <Sheet open={filterOpen} onOpenChange={(open) => {
            setFilterOpen(open)
            if (open) {
              setDetailPanelOpen(false)
              setSavedPanelOpen(false)
              setProfilePanelOpen(false)
            }
          }}>
            <SheetTrigger asChild>
              <Button
                variant={activeFilterCount > 0 ? "default" : "outline"}
                size="sm"
                className={cn(
                  "relative gap-1 sm:gap-1.5 h-7 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm shrink-0",
                  activeFilterCount > 0
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-transparent"
                )}
              >
                <SlidersHorizontal className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Filter
                <span className={cn("ml-0.5 rounded-full bg-primary-foreground/20 px-1 sm:px-1.5 text-[9px] sm:text-[10px] font-bold", activeFilterCount === 0 && "hidden")}>
                  {activeFilterCount}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto bg-card p-0">
              <SheetTitle className="sr-only">Class Filters</SheetTitle>
              <SheetDescription className="sr-only">Filter and narrow down the class catalogue</SheetDescription>
              <div className="p-5">{filterSidebar}</div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Expandable search bar (row below, only when toggled) */}
        {searchOpen && (
          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                autoFocus
                placeholder="Search all classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 bg-background text-sm pr-8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchQuery("") }}
              className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Search status */}
        {searchQuery.trim() && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {dbSearching ? "Searching..." : dbSearchResults ? `${dbSearchResults.length} result${dbSearchResults.length !== 1 ? "s" : ""}` : ""}
          </p>
        )}

        {/* Row 2: Active filter chips (only when filters are active) */}
        {activeFilterCount > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {activeFilterLabels.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => removeFilter(chip.key)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/20"
              >
                {chip.label}
                <X className="h-2.5 w-2.5" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-[10px] font-medium text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Main Body (fills remaining height) ─────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ── Card Grid (scrollable) ──────────────────────── */}
        <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-4 sm:py-4">
          {/* Category image carousel - Uber Eats style */}
          <div className="relative mb-3">
            {/* Left arrow - hidden on mobile */}
            <button
              type="button"
              onClick={() => {
                const container = document.getElementById('category-carousel')
                if (container) container.scrollBy({ left: -200, behavior: 'smooth' })
              }}
              className="absolute -left-1 top-1/2 z-10 hidden sm:flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition-colors hover:bg-muted"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Carousel */}
            <div 
              id="category-carousel"
              className="flex items-end gap-4 overflow-x-auto pb-1 scrollbar-hide sm:gap-5 lg:justify-between lg:gap-0 lg:overflow-x-visible"
            >
              {CATEGORY_CHIPS.map((cat) => {
                const isActive = filters.mainCategory === cat.value
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      // When selecting a category, turn off Recommended filter
                      if (!isActive) {
                        setActiveTab("all")
                      }
                      setFilters({ ...filters, mainCategory: isActive ? null : cat.value })
                    }}
                    className="group flex shrink-0 flex-col items-center gap-0.5"
                  >
                    <div className={cn(
                      "relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center transition-transform",
                      isActive && "scale-110"
                    )}>
                      <Image
                        src={cat.image}
                        alt={cat.label}
                        width={48}
                        height={48}
                        className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
                      />
                    </div>
                    <span className={cn(
                      "text-center text-[9px] sm:text-[10px] leading-tight transition-colors whitespace-nowrap",
                      isActive
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {cat.shortLabel}
                    </span>
                    {isActive && (
                      <div className="h-0.5 w-full rounded-full bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Right arrow - hidden on mobile */}
            <button
              type="button"
              onClick={() => {
                const container = document.getElementById('category-carousel')
                if (container) container.scrollBy({ left: 200, behavior: 'smooth' })
              }}
              className="absolute -right-1 top-1/2 z-10 hidden sm:flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition-colors hover:bg-muted"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Horizontal scrolling chip filters */}
          <div className="mb-3 sm:mb-4 flex items-center gap-2 overflow-x-auto overflow-y-hidden pb-1 scrollbar-hide">
            {/* Recommended chip (toggleable) */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "recommended" ? "all" : "recommended")}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-colors",
                activeTab === "recommended"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              <Sparkles className="h-3 w-3" />
              Recommended
              <span className={cn("rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px]", activeTab !== "recommended" && "hidden")}>
                {recTabCount}
              </span>
            </button>

            {/* Featured chip (toggleable) */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "staff_picks" ? "all" : "staff_picks")}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-colors",
                activeTab === "staff_picks"
                  ? "border-amber-500 bg-amber-500/10 text-amber-700"
                  : "border-border bg-card text-muted-foreground hover:border-amber-500/50 hover:text-foreground"
              )}
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              Featured
              <span className={cn("rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px]", (activeTab !== "staff_picks" || staffPicksCount === 0) && "hidden")}>
                {staffPicksCount}
              </span>
            </button>

            {/* Time filter chips */}
            {TIME_PREFS.map((pref) => {
              const isActive = filters.timePreset === pref.value
              return (
                <button
                  key={pref.value}
                  type="button"
                  onClick={() => setFilters({ ...filters, timePreset: isActive ? null : pref.value })}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {pref.label}
                </button>
              )
            })}

            {/* Date filter chips */}
            {DATE_PRESETS.slice(0, 3).map((preset) => {
              const isActive = filters.datePreset === preset.value
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setFilters({ ...filters, datePreset: isActive ? null : preset.value })}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  <CalendarDays className="h-3 w-3" />
                  {preset.label}
                </button>
              )
            })}

            {/* Borough dropdown */}
            <Select
              value={filters.borough || "all"}
              onValueChange={(val) => setFilters({ ...filters, borough: val === "all" ? null : val, library: null })}
            >
              <SelectTrigger className={cn(
                "h-7 w-auto min-w-[100px] shrink-0 rounded-full border px-2.5 text-[11px] sm:text-xs font-medium gap-1",
                filters.borough
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              )}>
                <MapPin className="h-3 w-3" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Boroughs</SelectItem>
                {BOROUGHS.map((borough) => (
                  <SelectItem key={borough} value={borough}>{borough}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recommendation banner */}
          {activeTab === "recommended" && userId && hasPrefs && (
            <div className="relative mb-4 overflow-hidden rounded-xl border border-border">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right, hsl(var(--primary) / 0.08), transparent 70%)",
                }}
              />
              <div className="relative flex items-start justify-between gap-4 p-3">
                <div className="flex flex-1 items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className={cn(!bannerOpen && "line-clamp-1")}>
                    <p className="text-xs font-medium text-foreground">
                      Your recommendations:{" "}
                      <span className="font-normal text-muted-foreground">
                        {summary}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBannerOpen(!bannerOpen)}
                    className="h-7 w-7 p-0 text-muted-foreground"
                  >
                    {bannerOpen ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditInterests(liveInterests)
                      setEditArchetypes(liveArchetypes)
                      setEditTimePrefs(liveTimePrefs)
                      setPrefModalOpen(true)
                    }}
                    className="h-7 gap-1 text-[10px] text-primary"
                  >
                    <Settings2 className="h-3 w-3" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Recommended tab empty state */}
          {activeTab === "recommended" && !hasPrefs && (
            <div className="mb-4 rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary/50" />
              <h3 className="mb-1 text-lg font-semibold text-foreground">
                Set your interests for recommendations
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Tell us what you like and we{"'"}ll suggest the best classes for
                you.
              </p>
              <Button
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <a href="/onboarding">Choose Interests</a>
              </Button>
            </div>
          )}

          {displayedClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
              <p className="mb-2 text-lg font-medium text-foreground">
                No classes found
              </p>
              <p className="mb-4 text-sm text-muted-foreground">
                Try adjusting your filters or search terms.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters(EMPTY_FILTERS)
                  setSearchQuery("")
                }}
                className="bg-transparent"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <div className={cn(
                "grid gap-3 sm:gap-4",
                detailPanelOpen && (savedPanelOpen || profilePanelOpen)
                  ? "grid-cols-1"
                  : detailPanelOpen || savedPanelOpen || profilePanelOpen
                    ? "sm:grid-cols-2"
                    : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
              )}>
                {paginatedClasses.map((classItem) => (
                  <ClassCard
                    key={classItem.id}
                    classItem={classItem}
                    isSaved={savedIds.includes(classItem.id)}
                    onToggleSave={toggleSave}
                    onOpenDetail={(item) => {
                      setSelectedClass(item)
                      if (isDesktop) {
                        setDetailPanelOpen(true)
                        setFilterOpen(false)
                      } else {
                        setDetailDialogOpen(true)
                      }
                    }}
                    userId={userId}
                  />
                ))}
              </div>

              {/* Pagination controls */}
              <div className="mt-6 flex flex-col gap-4 pb-4">
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {getPageNumbers().map((page, idx) => 
                      page === "ellipsis" ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "h-8 w-8 p-0",
                            currentPage === page && "bg-primary text-primary-foreground"
                          )}
                        >
                          {page}
                        </Button>
                      )
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                  <span className="text-center">
                    Showing {startIndex + 1}-{Math.min(endIndex, displayedClasses.length)} of {displayedClasses.length}
                    {countActiveFilters(filters) > 0 ? " (filtered)" : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline">Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="rounded border border-border bg-background px-2 py-1 text-xs"
                    >
                      {PAGE_SIZE_OPTIONS.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Right Side Panel ────────────────────────────── */}
        <ClassSidePanel
          detailOpen={detailPanelOpen}
          savedOpen={savedPanelOpen}
          profileOpen={profilePanelOpen}
          onDetailClose={() => setDetailPanelOpen(false)}
          onSavedToggle={() => {
            setSavedPanelOpen((p) => !p)
            setProfilePanelOpen(false)
          }}
          onProfileToggle={() => {
            setProfilePanelOpen((p) => !p)
            setSavedPanelOpen(false)
          }}
          selectedClass={selectedClass}
          onSelectClass={(cls) => {
            setSelectedClass(cls)
            if (isDesktop) {
              setDetailPanelOpen(true)
            } else {
              setDetailDialogOpen(true)
            }
          }}
          savedIds={savedIds}
          allClasses={allClasses}
          onToggleSave={toggleSave}
          userId={userId}
          savedIconRef={savedIconRef}
          isAdmin={isAdmin}
        />
      </div>

      {/* Mobile detail dialog */}
      <ClassDetailDialog
        classItem={selectedClass}
        open={detailDialogOpen && !isDesktop}
        onOpenChange={setDetailDialogOpen}
        isSaved={
          selectedClass ? savedIds.includes(selectedClass.id) : false
        }
        onToggleSave={toggleSave}
        userId={userId}
        isAdmin={isAdmin}
        onStaffPickToggle={handleStaffPickToggle}
      />

      {/* Flying bookmark animation */}
      {flyAnim && (
        <div
          className="pointer-events-none fixed z-[100]"
          style={{
            left: flyAnim.x,
            top: flyAnim.y,
            animation: "fly-to-saved 600ms ease-in-out forwards",
            ["--tx" as string]: `${flyAnim.tx - flyAnim.x}px`,
            ["--ty" as string]: `${flyAnim.ty - flyAnim.y}px`,
          }}
        >
          <Bookmark className="h-5 w-5 fill-primary text-primary" />
        </div>
      )}

      {/* Preference edit modal */}
      <Dialog open={prefModalOpen} onOpenChange={setPrefModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card text-card-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif text-foreground">
              Update Your Preferences
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Adjust your interests, archetype, and time preferences to refine
              recommendations.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 pt-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Topic Interests
              </p>
              <div className="flex flex-wrap gap-2">
                {MAIN_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() =>
                      setEditInterests(toggleIn(editInterests, cat.value))
                    }
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      editInterests.includes(cat.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {cat.value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Archetypes
              </p>
              <div className="flex flex-wrap gap-2">
                {ARCHETYPES.map((arch) => (
                  <button
                    key={arch.value}
                    type="button"
                    onClick={() =>
                      setEditArchetypes(toggleIn(editArchetypes, arch.value))
                    }
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      editArchetypes.includes(arch.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {arch.value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preferred Times
              </p>
              <div className="flex flex-wrap gap-2">
                {TIME_PREFS.map((pref) => (
                  <button
                    key={pref.value}
                    type="button"
                    onClick={() =>
                      setEditTimePrefs(toggleIn(editTimePrefs, pref.value))
                    }
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      editTimePrefs.includes(pref.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {pref.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPrefModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePrefs}
              disabled={savingPrefs}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {savingPrefs ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reminder & Feedback Modals */}
      <ClassReminderModal userId={userId} />
      <FeedbackRequestModal userId={userId} />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
