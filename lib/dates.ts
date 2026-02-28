import { format, addDays, isSameDay } from "date-fns"

export function getNext7Days(): { date: Date; label: string; dateStr: string }[] {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i)
    return {
      date,
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : format(date, "EEE, MMM d"),
      dateStr: format(date, "yyyy-MM-dd"),
    }
  })
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  const today = new Date()
  if (isSameDay(date, today)) return "Today"
  if (isSameDay(date, addDays(today, 1))) return "Tomorrow"
  return format(date, "EEE, MMM d")
}

export function getTodayStr(): string {
  return format(new Date(), "yyyy-MM-dd")
}
