import type { LibraryClass } from "@/lib/types"
import { parseClassDate, parseClassTime } from "@/lib/date-helpers"

/**
 * Generate and download an .ics calendar file for a class.
 */
export function downloadIcs(classItem: LibraryClass) {
  const date = parseClassDate(classItem.date)
  const hour = parseClassTime(classItem.time)

  if (!date || hour === null) {
    // Fallback: create an all-day event for today
    const now = new Date()
    const dtStart = formatIcsDate(now)
    const dtEnd = formatIcsDate(new Date(now.getTime() + 60 * 60 * 1000))
    triggerDownload(classItem, dtStart, dtEnd)
    return
  }

  date.setHours(hour, 0, 0, 0)
  const endDate = new Date(date.getTime() + 60 * 60 * 1000) // 1 hour default

  const dtStart = formatIcsDate(date)
  const dtEnd = formatIcsDate(endDate)
  triggerDownload(classItem, dtStart, dtEnd)
}

function formatIcsDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}

function triggerDownload(
  classItem: LibraryClass,
  dtStart: string,
  dtEnd: string
) {
  const location = classItem.location && classItem.location !== "Unknown" ? classItem.location : ""
  const description = (classItem.description || "").replace(/\n/g, "\\n")
  const url = classItem.link || ""

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Library Scout//EN",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${classItem.class_name}`,
    `DESCRIPTION:${description}${url ? `\\n\\nMore info: ${url}` : ""}`,
    location ? `LOCATION:${location}` : "",
    url ? `URL:${url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n")

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `${classItem.class_name.replace(/[^a-zA-Z0-9]/g, "_")}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
