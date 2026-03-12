/**
 * Parse CSV date strings like "Thu, February 26" or "Mon, February 2"
 * into a Date object (assuming current year 2026).
 */
export function parseClassDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === "Unknown") return null
  try {
    // Remove day-of-week prefix like "Thu, "
    const cleaned = dateStr.replace(/^[A-Za-z]+,\s*/, "")
    // Parse "February 26" -> Date
    const currentYear = new Date().getFullYear()
    const parsed = new Date(`${cleaned} ${currentYear}`)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Parse time strings like "11:00 AM", "4:00 PM", "10:00 AM" into hours (0-23)
 */
export function parseClassTime(timeStr: string): number | null {
  if (!timeStr || timeStr === "Unknown") return null
  try {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!match) return null
    let hours = Number.parseInt(match[1], 10)
    const period = match[3].toUpperCase()
    if (period === "PM" && hours !== 12) hours += 12
    if (period === "AM" && hours === 12) hours = 0
    return hours
  } catch {
    return null
  }
}

/**
 * Check if a date falls in a given preset range relative to today.
 */
export function matchesDatePreset(
  dateStr: string,
  preset: string
): boolean {
  const date = parseClassDate(dateStr)
  if (!date) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dayOfWeek = today.getDay() // 0=Sun, 6=Sat

  switch (preset) {
    case "today": {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      return d.getTime() === today.getTime()
    }
    case "this_week": {
      // Monday to Sunday of current week
      const monday = new Date(today)
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)
      return date >= monday && date <= sunday
    }
    case "weekend": {
      // This Saturday and Sunday
      const saturday = new Date(today)
      saturday.setDate(today.getDate() + (6 - dayOfWeek))
      saturday.setHours(0, 0, 0, 0)
      const sundayEnd = new Date(saturday)
      sundayEnd.setDate(saturday.getDate() + 1)
      sundayEnd.setHours(23, 59, 59, 999)
      return date >= saturday && date <= sundayEnd
    }
    case "next_week": {
      const nextMonday = new Date(today)
      nextMonday.setDate(today.getDate() + (7 - ((dayOfWeek + 6) % 7)))
      nextMonday.setHours(0, 0, 0, 0)
      const nextSunday = new Date(nextMonday)
      nextSunday.setDate(nextMonday.getDate() + 6)
      nextSunday.setHours(23, 59, 59, 999)
      return date >= nextMonday && date <= nextSunday
    }
    default:
      return false
  }
}

/**
 * Check if a time matches a preset range.
 */
export function matchesTimePreset(
  timeStr: string,
  preset: string
): boolean {
  const hour = parseClassTime(timeStr)
  if (hour === null) return false

  switch (preset) {
    case "morning":
      return hour < 12
    case "lunch":
      return hour >= 11 && hour < 14
    case "afternoon":
      return hour >= 12 && hour < 17
    case "after_work":
      return hour >= 17
    default:
      return false
  }
}
