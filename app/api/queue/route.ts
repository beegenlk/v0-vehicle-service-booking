import { NextRequest, NextResponse } from "next/server"
import { getBookingsForDate } from "@/lib/store"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")

  if (!date) {
    return NextResponse.json({ error: "Date parameter required" }, { status: 400 })
  }

  const bookings = getBookingsForDate(date)
  const activeBookings = bookings.filter((b) => b.status !== "Cancelled")

  // Sort by time slot and then by creation time
  activeBookings.sort((a, b) => {
    if (a.timeSlot !== b.timeSlot) {
      return a.timeSlot.localeCompare(b.timeSlot)
    }
    return a.createdAt.localeCompare(b.createdAt)
  })

  const nowServing = activeBookings.find((b) => b.status === "InService")
  const nextUp = activeBookings
    .filter((b) => b.status === "Waiting" || b.status === "Arrived")
    .slice(0, 2)

  return NextResponse.json({
    bookings: activeBookings,
    nowServing: nowServing || null,
    nextUp,
    stats: {
      total: activeBookings.length,
      waiting: activeBookings.filter((b) => b.status === "Waiting").length,
      arrived: activeBookings.filter((b) => b.status === "Arrived").length,
      inService: activeBookings.filter((b) => b.status === "InService").length,
      completed: activeBookings.filter((b) => b.status === "Completed").length,
    },
  })
}
