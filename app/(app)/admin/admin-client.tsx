"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  Flag,
  RefreshCw,
  Star,
  Search,
  Users,
  Database,
  Activity,
  ExternalLink,
  Bell,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Calendar,
  Share2,
  Eye,
  Heart,
  MousePointerClick,
  Tags,
  Edit2,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ARCHETYPE_VALUES, MAIN_CATEGORY_VALUES, SUB_CATEGORY_MAP } from "@/lib/types"
import Image from "next/image"
import { toast } from "sonner"

interface Report {
  id: number
  reason: string
  details: string
  created_at: string
  classes: { class_name: string } | null
}

interface ClassItem {
  id: number
  class_name: string
  is_staff_pick: boolean
  archetype?: string
  main_category?: string
  sub_category?: string
}

interface AdminClientProps {
  initialEditTagsClassId?: number
}

export function AdminClient({ initialEditTagsClassId }: AdminClientProps) {
  const [classCount, setClassCount] = useState(0)
  const [reports, setReports] = useState<Report[]>([])
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [staffPickSearch, setStaffPickSearch] = useState("")
  const [togglingStaffPick, setTogglingStaffPick] = useState<number | null>(null)
  const [usageStats, setUsageStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSaves: 0,
    totalFeedback: 0,
  })
  const [modalSettings, setModalSettings] = useState({
    reminder_modal_enabled: true,
    feedback_modal_enabled: true,
  })
  const [togglingModal, setTogglingModal] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<{
    topClasses: { classId: number; name: string; count: number }[]
    topArchetypes: { archetype: string; count: number }[]
    totalClicks: number
  }>({ topClasses: [], topArchetypes: [], totalClicks: 0 })
  const [mostSavedClasses, setMostSavedClasses] = useState<
    { classId: number; name: string; saveCount: number }[]
  >([])
  const [engagementAnalytics, setEngagementAnalytics] = useState({
    icsDownloads: 0,
    linkClicks: 0,
    totalShares: 0,
    sharesByType: {} as Record<string, number>,
    totalViews: 0,
    totalInterests: 0,
    attendanceIntent: {} as Record<string, number>,
  })
  
  // Tag editing state
  const [tagEditClass, setTagEditClass] = useState<ClassItem | null>(null)
  const [tagEditArchetype, setTagEditArchetype] = useState("")
  const [tagEditMainCategory, setTagEditMainCategory] = useState("")
  const [tagEditSubCategory, setTagEditSubCategory] = useState("")
  const [savingTags, setSavingTags] = useState(false)
  const [tagSearch, setTagSearch] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [classesRes, settingsRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/classes"),
        fetch("/api/admin/settings"),
        fetch("/api/admin/analytics"),
      ])
      
      if (classesRes.ok) {
        const data = await classesRes.json()
        setClassCount(data.classCount)
        setReports(data.reports)
        setClasses(data.classes || [])
        setUsageStats({
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          totalSaves: data.totalSaves || 0,
          totalFeedback: data.totalFeedback || 0,
        })
        setMostSavedClasses(data.mostSavedClasses || [])
        if (data.analytics) {
          setEngagementAnalytics(data.analytics)
        }
      }
      
      if (settingsRes.ok) {
        const { settings } = await settingsRes.json()
        setModalSettings({
          reminder_modal_enabled: settings.reminder_modal_enabled ?? true,
          feedback_modal_enabled: settings.feedback_modal_enabled ?? true,
        })
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalyticsData(data)
      }
    } catch {
      toast.error("Failed to load admin data")
    }
    setLoading(false)
  }, [])

  async function toggleModalSetting(key: string, currentValue: boolean) {
    setTogglingModal(key)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: !currentValue }),
      })
      if (res.ok) {
        setModalSettings((prev) => ({ ...prev, [key]: !currentValue }))
        toast.success(`${key === "reminder_modal_enabled" ? "Reminder" : "Feedback"} modal ${!currentValue ? "enabled" : "disabled"}`)
      } else {
        toast.error("Failed to update setting")
      }
    } catch {
      toast.error("Failed to update setting")
    }
    setTogglingModal(null)
  }

  async function toggleStaffPick(classId: number, currentValue: boolean) {
    setTogglingStaffPick(classId)
    try {
      const res = await fetch("/api/admin/staff-pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, isStaffPick: !currentValue }),
      })
      if (res.ok) {
        setClasses((prev) =>
          prev.map((c) =>
            c.id === classId ? { ...c, is_staff_pick: !currentValue } : c
          )
        )
        toast.success(!currentValue ? "Added to Featured" : "Removed from Featured")
      } else {
        toast.error("Failed to update")
      }
    } catch {
      toast.error("Failed to update")
    }
    setTogglingStaffPick(null)
  }

  const filteredClasses = classes.filter((c) =>
    c.class_name.toLowerCase().includes(staffPickSearch.toLowerCase())
  )

  const staffPicks = classes.filter((c) => c.is_staff_pick)

  const tagFilteredClasses = classes.filter((c) =>
    c.class_name.toLowerCase().includes(tagSearch.toLowerCase())
  )

  function openTagEditor(cls: ClassItem) {
    setTagEditClass(cls)
    setTagEditArchetype(cls.archetype || "")
    setTagEditMainCategory(cls.main_category || "")
    setTagEditSubCategory(cls.sub_category || "")
  }

  function closeTagEditor() {
    setTagEditClass(null)
    setTagEditArchetype("")
    setTagEditMainCategory("")
    setTagEditSubCategory("")
  }

  async function saveTags() {
    if (!tagEditClass) return
    setSavingTags(true)
    try {
      const res = await fetch("/api/admin/update-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: tagEditClass.id,
          archetype: tagEditArchetype || null,
          mainCategory: tagEditMainCategory || null,
          subCategory: tagEditSubCategory || null,
        }),
      })
      if (res.ok) {
        setClasses((prev) =>
          prev.map((c) =>
            c.id === tagEditClass.id
              ? {
                  ...c,
                  archetype: tagEditArchetype || undefined,
                  main_category: tagEditMainCategory || undefined,
                  sub_category: tagEditSubCategory || undefined,
                }
              : c
          )
        )
        toast.success("Tags updated successfully")
        closeTagEditor()
      } else {
        toast.error("Failed to update tags")
      }
    } catch {
      toast.error("Failed to update tags")
    }
    setSavingTags(false)
  }

  // Get available sub-categories based on selected main category
  const availableSubCategories = tagEditMainCategory
    ? SUB_CATEGORY_MAP[tagEditMainCategory] || []
    : Object.values(SUB_CATEGORY_MAP).flat()

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-open tag editor if initialEditTagsClassId is provided
  useEffect(() => {
    if (initialEditTagsClassId && classes.length > 0) {
      const classToEdit = classes.find(c => c.id === initialEditTagsClassId)
      if (classToEdit) {
        openTagEditor(classToEdit)
      }
    }
  }, [initialEditTagsClassId, classes])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file.")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error || "Upload failed")
      }
    } catch {
      toast.error("Upload failed")
    }
    setUploading(false)
    // Reset the input
    e.target.value = ""
  }

  async function handleDeleteAll() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)
    try {
      const res = await fetch("/api/admin/classes", { method: "DELETE" })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        setConfirmDelete(false)
        fetchData()
      } else {
        toast.error(data.error || "Delete failed")
      }
    } catch {
      toast.error("Delete failed")
    }
    setDeleting(false)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage monthly class data and view user reports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Class Data Management */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Class Data
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Current Classes
                </p>
                <p className="text-2xl font-bold text-primary">
                  {loading ? "..." : classCount}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchData}
                disabled={loading}
                aria-label="Refresh data"
              >
                <RefreshCw
                  className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>

            <Separator />

            {/* Upload new CSV */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                Upload New Month{"'"}s CSV
              </h4>
              <p className="mb-3 text-xs text-muted-foreground">
                Upload a CSV file with columns: Class Name, Description, Date,
                Time, Link, Archetype, Main Category, Sub-Category, In person or
                Online, Location
              </p>
              <label
                htmlFor="csv-upload"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Upload className="h-5 w-5" />
                {uploading ? "Uploading..." : "Click to upload CSV"}
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleUpload}
                disabled={uploading}
                className="sr-only"
              />
            </div>

            <Separator />

            {/* Delete all classes */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                Delete All Classes
              </h4>
              <p className="mb-3 text-xs text-muted-foreground">
                Remove last month{"'"}s data before uploading the new month. This
                will also clear all saves, feedback, and reports for those
                classes.
              </p>
              {confirmDelete && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive shrink-0" />
                  <p className="text-xs text-destructive">
                    This will permanently delete all {classCount} classes and
                    their associated data. Click again to confirm.
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAll}
                  disabled={deleting || classCount === 0}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting
                    ? "Deleting..."
                    : confirmDelete
                      ? "Confirm Delete All"
                      : "Delete All Classes"}
                </Button>
                {confirmDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                    className="text-muted-foreground"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Flag className="h-5 w-5 text-primary" />
              Recent Reports
              {reports.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {reports.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Flag className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No reports yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-lg border border-border bg-muted/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {report.classes?.class_name || "Unknown class"}
                      </p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {report.reason}
                      </Badge>
                    </div>
                    {report.details && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {report.details}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
            </CardContent>
        </Card>
      </div>

      {/* Usage & Cost Monitoring */}
      <Card className="mt-6 bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="h-5 w-5 text-primary" />
            Usage Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Track app usage to estimate costs. For detailed billing, visit your Supabase and Vercel dashboards.
          </p>
          
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-xs">Registered Users</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {loading ? "..." : usageStats.totalUsers}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Accounts created
              </p>
            </div>
            
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span className="text-xs">New Users (30d)</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {loading ? "..." : usageStats.activeUsers}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Signed up recently
              </p>
            </div>
            
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database className="h-4 w-4" />
                <span className="text-xs">Total Saves</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {loading ? "..." : usageStats.totalSaves}
              </p>
            </div>
            
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="text-xs">Classes Attended</span>
              </div>
              <p className="mt-1 text-xl font-bold text-primary">
                {loading ? "..." : usageStats.totalFeedback}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Goal: 100,000
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-2">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Supabase Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Vercel Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <p className="mt-4 text-[10px] text-muted-foreground">
            Estimated costs: Free tier covers ~500 MAU + 500MB DB. Pro tier ($45/mo total) for higher usage.
          </p>
        </CardContent>
      </Card>

      {/* Engagement Analytics */}
      <Card className="mt-6 bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            Engagement Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Track how users are engaging with classes - views, calendar adds, link clicks, shares, and interest.
          </p>
          
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span className="text-xs">Views</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {loading ? "..." : engagementAnalytics.totalViews.toLocaleString()}
              </p>
            </div>
            
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Calendar Adds</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {loading ? "..." : engagementAnalytics.icsDownloads.toLocaleString()}
              </p>
            </div>
            
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MousePointerClick className="h-4 w-4" />
                <span className="text-xs">NYPL Clicks</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {loading ? "..." : engagementAnalytics.linkClicks.toLocaleString()}
              </p>
            </div>
            
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Share2 className="h-4 w-4" />
                <span className="text-xs">Shares</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {loading ? "..." : engagementAnalytics.totalShares.toLocaleString()}
              </p>
            </div>
            
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span className="text-xs">Interests</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {loading ? "..." : engagementAnalytics.totalInterests.toLocaleString()}
              </p>
            </div>
            
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-xs">Planning to Go</span>
              </div>
              <p className="mt-1 text-xl font-bold text-primary">
                {loading ? "..." : (engagementAnalytics.attendanceIntent?.planning_to_go || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Share breakdown */}
          {Object.keys(engagementAnalytics.sharesByType).length > 0 && (
            <>
              <Separator className="my-4" />
              <h4 className="mb-2 text-sm font-medium text-foreground">Share Breakdown</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(engagementAnalytics.sharesByType).map(([type, count]) => (
                  <Badge key={type} variant="secondary" className="gap-1">
                    {type.replace(/_/g, " ")}: {count}
                  </Badge>
                ))}
              </div>
            </>
          )}

          {/* Attendance intent breakdown */}
          {Object.keys(engagementAnalytics.attendanceIntent).length > 0 && (
            <>
              <Separator className="my-4" />
              <h4 className="mb-2 text-sm font-medium text-foreground">Attendance Intent Poll</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(engagementAnalytics.attendanceIntent).map(([intent, count]) => (
                  <Badge key={intent} variant="outline" className="gap-1">
                    {intent.replace(/_/g, " ")}: {count}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Class Analytics */}
      <Card className="mt-6 bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <BarChart3 className="h-5 w-5 text-primary" />
            Class Analytics
            <Badge variant="secondary" className="ml-auto">
              Last 30 days
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Track which classes and categories are getting the most attention from all visitors (logged in or not).
          </p>
          
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-border p-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Total clicks:</span>
            <span className="text-lg font-bold text-foreground">{analyticsData.totalClicks.toLocaleString()}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Top Classes */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">Most Clicked Classes</h4>
              {analyticsData.topClasses.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {analyticsData.topClasses.slice(0, 5).map((cls, i) => (
                    <div key={cls.classId} className="flex items-center justify-between rounded border border-border p-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {i + 1}
                        </span>
                        <span className="text-xs text-foreground line-clamp-1">{cls.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{cls.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Most Saved Classes */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">Most Saved Classes</h4>
              {mostSavedClasses.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {mostSavedClasses.slice(0, 5).map((cls, i) => (
                    <div key={cls.classId} className="flex items-center justify-between rounded border border-border p-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10 text-xs font-medium text-green-600">
                          {i + 1}
                        </span>
                        <span className="text-xs text-foreground line-clamp-1">{cls.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{cls.saveCount} saves</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Categories */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">Most Popular Categories</h4>
              {analyticsData.topArchetypes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {analyticsData.topArchetypes.slice(0, 5).map((arch, i) => (
                    <div key={arch.archetype} className="flex items-center justify-between rounded border border-border p-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {i + 1}
                        </span>
                        <span className="text-xs text-foreground">{arch.archetype}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{arch.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Triggers */}
      <Card className="mt-6 bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bell className="h-5 w-5 text-primary" />
            Modal Triggers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Control when users see reminder and feedback modals. These help drive engagement and collect feedback.
          </p>
          
          <div className="space-y-3">
            {/* Reminder Modal Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                  <Bell className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Class Reminder Modal</p>
                  <p className="text-xs text-muted-foreground">
                    Shows 2 days before a saved class to remind users to sign up
                  </p>
                </div>
              </div>
              <Button
                variant={modalSettings.reminder_modal_enabled ? "default" : "outline"}
                size="sm"
                onClick={() => toggleModalSetting("reminder_modal_enabled", modalSettings.reminder_modal_enabled)}
                disabled={togglingModal === "reminder_modal_enabled"}
              >
                {togglingModal === "reminder_modal_enabled" ? "..." : modalSettings.reminder_modal_enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            {/* Feedback Modal Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                  <MessageSquare className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Feedback Request Modal</p>
                  <p className="text-xs text-muted-foreground">
                    Shows 1 day after a saved class to collect feedback and ratings
                  </p>
                </div>
              </div>
              <Button
                variant={modalSettings.feedback_modal_enabled ? "default" : "outline"}
                size="sm"
                onClick={() => toggleModalSetting("feedback_modal_enabled", modalSettings.feedback_modal_enabled)}
                disabled={togglingModal === "feedback_modal_enabled"}
              >
                {togglingModal === "feedback_modal_enabled" ? "..." : modalSettings.feedback_modal_enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Classes Management */}
      <Card className="mt-6 bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Image
              src="/images/gold-star.png"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
            Featured Classes
            {staffPicks.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {staffPicks.length} selected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Mark classes as Featured to highlight them with a gold star. These will appear in the "Featured" filter.
          </p>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search classes..."
              value={staffPickSearch}
              onChange={(e) => setStaffPickSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Current featured classes */}
          {staffPicks.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-foreground">Currently Featured</h4>
              <div className="flex flex-wrap gap-2">
                {staffPicks.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => toggleStaffPick(c.id, true)}
                    disabled={togglingStaffPick === c.id}
                    className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/20"
                  >
                    <Image
                      src="/images/gold-star.png"
                      alt=""
                      width={12}
                      height={12}
                      className="h-3 w-3 object-contain"
                    />
                    <span className="max-w-[200px] truncate">{c.class_name}</span>
                    <span className="text-amber-500">×</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Class list */}
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading...</p>
            ) : filteredClasses.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {staffPickSearch ? "No classes match your search" : "No classes available"}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {filteredClasses.slice(0, 50).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => toggleStaffPick(c.id, c.is_staff_pick)}
                    disabled={togglingStaffPick === c.id}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${c.is_staff_pick ? 'opacity-100' : 'opacity-30'}`}>
                      <Image
                        src="/images/gold-star.png"
                        alt=""
                        width={18}
                        height={18}
                        className="h-[18px] w-[18px] object-contain"
                      />
                    </div>
                    <span className="flex-1 truncate text-sm text-foreground">{c.class_name}</span>
                    {togglingStaffPick === c.id && (
                      <span className="text-xs text-muted-foreground">Saving...</span>
                    )}
                  </button>
                ))}
                {filteredClasses.length > 50 && (
                  <p className="p-3 text-center text-xs text-muted-foreground">
                    Showing 50 of {filteredClasses.length} classes. Use search to find more.
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tag Management */}
      <Card className="mt-6 bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Tags className="h-5 w-5 text-primary" />
            Tag Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Edit class tags (archetype, category, subcategory) to improve filtering and recommendations.
          </p>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search classes to edit tags..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Class list */}
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading...</p>
            ) : tagFilteredClasses.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {tagSearch ? "No classes match your search" : "No classes available"}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {tagFilteredClasses.slice(0, 50).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openTagEditor(c)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="block truncate text-sm text-foreground">{c.class_name}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {c.archetype && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {c.archetype}
                          </Badge>
                        )}
                        {c.main_category && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {c.main_category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {tagFilteredClasses.length > 50 && (
                  <p className="p-3 text-center text-xs text-muted-foreground">
                    Showing 50 of {tagFilteredClasses.length} classes. Use search to find more.
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tag Edit Modal */}
      <Dialog open={!!tagEditClass} onOpenChange={(open) => !open && closeTagEditor()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Edit Tags
            </DialogTitle>
          </DialogHeader>
          
          {tagEditClass && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {tagEditClass.class_name}
              </p>
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Archetype</Label>
                  <Select value={tagEditArchetype || "__none__"} onValueChange={(val) => setTagEditArchetype(val === "__none__" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select archetype..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {ARCHETYPE_VALUES.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label>Main Category</Label>
                  <Select 
                    value={tagEditMainCategory || "__none__"} 
                    onValueChange={(val) => {
                      const newVal = val === "__none__" ? "" : val
                      setTagEditMainCategory(newVal)
                      // Reset sub-category if it's not valid for new main category
                      if (newVal && SUB_CATEGORY_MAP[newVal] && !SUB_CATEGORY_MAP[newVal].includes(tagEditSubCategory)) {
                        setTagEditSubCategory("")
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {MAIN_CATEGORY_VALUES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label>Sub-Category</Label>
                  <Select value={tagEditSubCategory || "__none__"} onValueChange={(val) => setTagEditSubCategory(val === "__none__" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub-category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {availableSubCategories.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={closeTagEditor}>
                  Cancel
                </Button>
                <Button onClick={saveTags} disabled={savingTags}>
                  {savingTags ? "Saving..." : "Save Tags"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
