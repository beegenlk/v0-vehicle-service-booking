import { NextRequest, NextResponse } from "next/server"
import { getSlotsForDate, getBookingsForDate, createBooking } from "@/lib/store"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")

  if (!date) {
    return NextResponse.json({ error: "Date parameter required" }, { status: 400 })
  }

  const slots = getSlotsForDate(date)
  const bookings = getBookingsForDate(date)

  return NextResponse.json({ slots, bookings })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { date, timeSlot, customerName, phone, vehicleNo } = body

  if (!date || !timeSlot || !customerName || !phone || !vehicleNo) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    )
  }

  const result = createBooking({ date, timeSlot, customerName, phone, vehicleNo })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ booking: result.booking }, { status: 201 })
}
