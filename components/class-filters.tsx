"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { X, Info, Flame } from "lucide-react"
import {
  ARCHETYPES,
  MAIN_CATEGORIES,
  SUB_CATEGORY_MAP,
  DATE_PRESETS,
  TIME_PREFS,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import type { LibraryClass } from "@/lib/types"
import { matchesDatePreset, matchesTimePreset } from "@/lib/date-helpers"
import { getArchetypeStyle } from "@/lib/archetype-styles"
import { BOROUGHS, getLibrariesByBorough, NYPL_LIBRARIES, findLibrary } from "@/lib/nypl-locations"

export interface Filters {
  archetypes: string[]
  mainCategory: string
  subCategory: string
  format: string
  borough: string
  library: string
  datePreset: string
  timePreset: string
  hotOnly: boolean
}

export const EMPTY_FILTERS: Filters = {
  archetypes: [],
  mainCategory: "",
  subCategory: "",
  format: "",
  borough: "",
  library: "",
  datePreset: "",
  timePreset: "",
  hotOnly: false,
}

/** Returns number of active filter values */
export function countActiveFilters(filters: Filters): number {
  let count = 0
  count += filters.archetypes.length
  if (filters.mainCategory) count++
  if (filters.subCategory) count++
  if (filters.format) count++
  if (filters.borough) count++
  if (filters.library) count++
  if (filters.datePreset) count++
  if (filters.timePreset) count++
  if (filters.hotOnly) count++
  return count
}

/** Returns a human-readable list of active filter labels for chips */
export function getActiveFilterLabels(filters: Filters): { key: keyof Filters | string; label: string }[] {
  const labels: { key: string; label: string }[] = []
  if (filters.hotOnly) labels.push({ key: "hotOnly", label: "Hot Classes" })
  for (const arch of filters.archetypes) {
    labels.push({ key: `arch_${arch}`, label: arch })
  }
  if (filters.datePreset) {
    const preset = DATE_PRESETS.find((p) => p.value === filters.datePreset)
    labels.push({ key: "datePreset", label: preset?.label || filters.datePreset })
  }
  if (filters.timePreset) {
    const pref = TIME_PREFS.find((p) => p.value === filters.timePreset)
    labels.push({ key: "timePreset", label: pref?.label || filters.timePreset })
  }
  if (filters.mainCategory) {
    labels.push({ key: "mainCategory", label: filters.mainCategory })
  }
  if (filters.subCategory) {
    labels.push({ key: "subCategory", label: filters.subCategory })
  }
  if (filters.format) {
    labels.push({ key: "format", label: filters.format })
  }
  if (filters.borough) {
    labels.push({ key: "borough", label: filters.borough })
  }
  if (filters.library) {
    labels.push({ key: "library", label: filters.library })
  }
  return labels
}

interface ClassFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  allClasses: LibraryClass[]
  libraries: string[]
  activeCount: number
}

function countForArchetype(
  arch: string,
  currentFilters: Filters,
  allClasses: LibraryClass[]
): number {
  return allClasses.filter((c) => {
    if (c.archetype !== arch) return false
    if (currentFilters.mainCategory && c.main_category !== currentFilters.mainCategory) return false
    if (currentFilters.subCategory && c.sub_category !== currentFilters.subCategory) return false
    if (currentFilters.format && c.format !== currentFilters.format) return false
    if (currentFilters.borough) {
      const lib = findLibrary(c.location)
      if (!lib || lib.borough !== currentFilters.borough) return false
    }
    if (currentFilters.library && c.location !== currentFilters.library) return false
    if (currentFilters.datePreset && !matchesDatePreset(c.date, currentFilters.datePreset)) return false
    if (currentFilters.timePreset && !matchesTimePreset(c.time, currentFilters.timePreset)) return false
    if (currentFilters.hotOnly && !c.is_hot) return false
    return true
  }).length
}

function countForDate(preset: string, currentFilters: Filters, allClasses: LibraryClass[]): number {
  return allClasses.filter((c) => {
    if (!matchesDatePreset(c.date, preset)) return false
    if (currentFilters.archetypes.length > 0 && !currentFilters.archetypes.includes(c.archetype)) return false
    if (currentFilters.mainCategory && c.main_category !== currentFilters.mainCategory) return false
    if (currentFilters.hotOnly && !c.is_hot) return false
    return true
  }).length
}

function countForTime(preset: string, currentFilters: Filters, allClasses: LibraryClass[]): number {
  return allClasses.filter((c) => {
    if (!matchesTimePreset(c.time, preset)) return false
    if (currentFilters.archetypes.length > 0 && !currentFilters.archetypes.includes(c.archetype)) return false
    if (currentFilters.mainCategory && c.main_category !== currentFilters.mainCategory) return false
    if (currentFilters.hotOnly && !c.is_hot) return false
    return true
  }).length
}

export function ClassFilters({
  filters,
  onFiltersChange,
  allClasses,
  libraries,
  activeCount,
}: ClassFiltersProps) {
  // Prevent hydration mismatch: date/time counts depend on new Date()
  // which can differ between server and client.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    onFiltersChange({ ...filters, [key]: value })
  }

  function toggleArchetype(arch: string) {
    const current = filters.archetypes
    const next = current.includes(arch)
      ? current.filter((a) => a !== arch)
      : [...current, arch]
    onFiltersChange({ ...filters, archetypes: next })
  }

  function clearAll() {
    onFiltersChange(EMPTY_FILTERS)
  }

  const hasActiveFilters = countActiveFilters(filters) > 0

  const subCats = filters.mainCategory
    ? SUB_CATEGORY_MAP[filters.mainCategory] || []
    : []

  const hotCount = allClasses.filter((c) => c.is_hot).length

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Filters
        </h3>

        {/* Hot Classes at the top */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[hsl(0,84%,60%)]" />
            <Label
              htmlFor="hot-toggle"
              className="text-sm font-semibold text-foreground"
            >
              Hot Classes Only
            </Label>
            <span className="rounded-full bg-[hsl(0,84%,60%)]/10 px-2 py-0.5 text-xs font-medium text-[hsl(0,84%,60%)]">
              {hotCount}
            </span>
          </div>
          <Switch
            id="hot-toggle"
            checked={filters.hotOnly}
            onCheckedChange={(checked) => updateFilter("hotOnly", checked)}
          />
        </div>

        {/* Date Presets */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              When
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((preset) => {
              const count = mounted ? countForDate(preset.value, filters, allClasses) : null
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() =>
                    updateFilter("datePreset", filters.datePreset === preset.value ? "" : preset.value)
                  }
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    filters.datePreset === preset.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {preset.label}{count !== null ? ` (${count})` : ""}
                </button>
              )
            })}
          </div>
        </div>

        {/* Time Presets */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Time of Day
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {TIME_PREFS.map((pref) => {
              const count = mounted ? countForTime(pref.value, filters, allClasses) : null
              return (
                <Tooltip key={pref.value}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() =>
                        updateFilter("timePreset", filters.timePreset === pref.value ? "" : pref.value)
                      }
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        filters.timePreset === pref.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {pref.label}{count !== null ? ` (${count})` : ""}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {pref.description}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>

        {/* Borough Filter */}
        <div>
          <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Borough
          </Label>
          <Select
            value={filters.borough || "all"}
            onValueChange={(val) => {
              onFiltersChange({
                ...filters,
                borough: val === "all" ? "" : val,
                library: "", // Clear library when borough changes
              })
            }}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All boroughs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All boroughs</SelectItem>
              {BOROUGHS.map((borough) => (
                <SelectItem key={borough} value={borough}>{borough}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Library Dropdown - grouped by borough */}
        <div>
          <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Library
          </Label>
          <Select
            value={filters.library || "all"}
            onValueChange={(val) => {
              if (val === "all") {
                updateFilter("library", "")
              } else {
                // Also set the borough based on the selected library
                const lib = NYPL_LIBRARIES.find(l => l.name === val)
                if (lib) {
                  onFiltersChange({
                    ...filters,
                    library: val,
                    borough: lib.borough,
                  })
                } else {
                  updateFilter("library", val)
                }
              }
            }}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All libraries" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All libraries</SelectItem>
              {(() => {
                const grouped = getLibrariesByBorough()
                const filteredBoroughs = filters.borough 
                  ? [filters.borough as keyof typeof grouped] 
                  : BOROUGHS
                return filteredBoroughs.map((borough) => {
                  const libs = grouped[borough as keyof typeof grouped] || []
                  if (libs.length === 0) return null
                  return (
                    <div key={borough}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                        {borough}
                      </div>
                      {libs.map((lib) => (
                        <SelectItem key={lib.name} value={lib.name} className="pl-4">
                          {lib.name}
                        </SelectItem>
                      ))}
                    </div>
                  )
                })
              })()}
            </SelectContent>
          </Select>
        </div>

        {/* Archetype multi-select pills with tooltips */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Archetype
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px] text-xs">
                Archetypes describe what kind of learner you are. Select multiple to broaden results.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex flex-wrap gap-2">
            {ARCHETYPES.map((arch) => {
              const isActive = filters.archetypes.includes(arch.value)
              const count = countForArchetype(arch.value, filters, allClasses)
              const archStyle = getArchetypeStyle(arch.value)
              const ArchIcon = archStyle.icon
              return (
                <Tooltip key={arch.value}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => toggleArchetype(arch.value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      <ArchIcon className="h-3 w-3" />
                      {arch.value} ({count})
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                    {arch.description}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>

        {/* Category */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Category
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px] text-xs">
                Choose a main category to see its sub-categories below.
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={filters.mainCategory || "all"}
            onValueChange={(val) => {
              onFiltersChange({
                ...filters,
                mainCategory: val === "all" ? "" : val,
                subCategory: "",
              })
            }}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">All categories</SelectItem>
              {MAIN_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sub-category (cascading from main category) */}
        {subCats.length > 0 && (
          <div>
            <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sub-Category
            </Label>
            <Select
              value={filters.subCategory || "all"}
              onValueChange={(val) => updateFilter("subCategory", val === "all" ? "" : val)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All sub-categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sub-categories</SelectItem>
                {subCats.map((sub) => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Format */}
        <div>
          <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Format
          </Label>
          <Select
            value={filters.format || "all"}
            onValueChange={(val) => updateFilter("format", val === "all" ? "" : val)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All formats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All formats</SelectItem>
              <SelectItem value="In Person">In Person</SelectItem>
              <SelectItem value="Online">Online</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active filters count + clear */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between border-t border-border pt-3">
            <Badge variant="secondary" className="text-xs">
              {activeCount} result{activeCount !== 1 ? "s" : ""}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="gap-1 text-xs text-muted-foreground"
            >
              <X className="h-3 w-3" />
              Clear all
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
