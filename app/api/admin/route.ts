import { NextRequest, NextResponse } from "next/server"
import {
  getBookingsForDate,
  getSlotsForDate,
  updateBookingStatus,
  addCustomSlot,
  removeSlot,
  updateSlotCapacity,
  type BookingStatus,
} from "@/lib/store"

const ADMIN_PASSWORD = "admin123"

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("x-admin-password")
  return authHeader === ADMIN_PASSWORD
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")

  if (!date) {
    return NextResponse.json({ error: "Date parameter required" }, { status: 400 })
  }

  const bookings = getBookingsForDate(date)
  const slots = getSlotsForDate(date)

  // Sort bookings by time slot
  bookings.sort((a, b) => {
    if (a.timeSlot !== b.timeSlot) {
      return a.timeSlot.localeCompare(b.timeSlot)
    }
    return a.createdAt.localeCompare(b.createdAt)
  })

  const stats = {
    total: bookings.filter((b) => b.status !== "Cancelled").length,
    waiting: bookings.filter((b) => b.status === "Waiting").length,
    arrived: bookings.filter((b) => b.status === "Arrived").length,
    inService: bookings.filter((b) => b.status === "InService").length,
    completed: bookings.filter((b) => b.status === "Completed").length,
    cancelled: bookings.filter((b) => b.status === "Cancelled").length,
  }

  return NextResponse.json({ bookings, slots, stats })
}

export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { bookingId, status } = body as { bookingId: string; status: BookingStatus }

  if (!bookingId || !status) {
    return NextResponse.json(
      { error: "bookingId and status are required" },
      { status: 400 }
    )
  }

  const validStatuses: BookingStatus[] = [
    "Waiting",
    "Arrived",
    "InService",
    "Completed",
    "Cancelled",
  ]
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const result = updateBookingStatus(bookingId, status)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { action, date, slotTime, maxCapacity } = body

  if (action === "addSlot") {
    if (!date || !slotTime) {
      return NextResponse.json(
        { error: "date and slotTime are required" },
        { status: 400 }
      )
    }
    const result = addCustomSlot(date, slotTime, maxCapacity || 3)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  }

  if (action === "removeSlot") {
    if (!date || !slotTime) {
      return NextResponse.json(
        { error: "date and slotTime are required" },
        { status: 400 }
      )
    }
    const result = removeSlot(date, slotTime)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  }

  if (action === "updateCapacity") {
    if (!date || !slotTime || maxCapacity === undefined) {
      return NextResponse.json(
        { error: "date, slotTime, and maxCapacity are required" },
        { status: 400 }
      )
    }
    const result = updateSlotCapacity(date, slotTime, maxCapacity)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
