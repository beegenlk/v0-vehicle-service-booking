// In-memory data store for bookings and service slots
// Note: Data resets on server restart. For production, use a database.

export type BookingStatus = "Waiting" | "Arrived" | "InService" | "Completed" | "Cancelled"

export interface Booking {
  id: string
  date: string // YYYY-MM-DD
  timeSlot: string // e.g. "9:00 AM"
  customerName: string
  phone: string
  vehicleNo: string
  status: BookingStatus
  createdAt: string
}

export interface ServiceSlot {
  id: string
  date: string
  slotTime: string
  maxCapacity: number
  bookedCount: number
}

const DEFAULT_SLOT_TIMES = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
]

const MAX_PER_SLOT = 1
const MAX_PER_DAY = 20

// In-memory storage
const bookings: Booking[] = []
const serviceSlots: ServiceSlot[] = []

let bookingCounter = 0

function generateBookingId(): string {
  bookingCounter++
  return `BK${String(bookingCounter).padStart(3, "0")}`
}

function getOrCreateSlotsForDate(date: string): ServiceSlot[] {
  const existing = serviceSlots.filter((s) => s.date === date)
  if (existing.length > 0) return existing

  // Create default slots for the date
  const newSlots: ServiceSlot[] = DEFAULT_SLOT_TIMES.map((time, i) => ({
    id: `${date}-${i}`,
    date,
    slotTime: time,
    maxCapacity: MAX_PER_SLOT,
    bookedCount: 0,
  }))
  serviceSlots.push(...newSlots)
  return newSlots
}

export function getSlotsForDate(date: string): ServiceSlot[] {
  return getOrCreateSlotsForDate(date)
}

export function getBookingsForDate(date: string): Booking[] {
  return bookings.filter((b) => b.date === date)
}

export function getBookingById(id: string): Booking | undefined {
  return bookings.find((b) => b.id === id)
}

export function getTodayBookingsCount(date: string): number {
  return bookings.filter((b) => b.date === date && b.status !== "Cancelled").length
}

export function createBooking(data: {
  date: string
  timeSlot: string
  customerName: string
  phone: string
  vehicleNo: string
}): { success: boolean; booking?: Booking; error?: string } {
  // Check daily limit
  const todayCount = getTodayBookingsCount(data.date)
  if (todayCount >= MAX_PER_DAY) {
    return { success: false, error: "Daily booking limit reached (max 20 per day)" }
  }

  // Check slot availability
  const slots = getOrCreateSlotsForDate(data.date)
  const slot = slots.find((s) => s.slotTime === data.timeSlot)
  if (!slot) {
    return { success: false, error: "Invalid time slot" }
  }
  if (slot.bookedCount >= slot.maxCapacity) {
    return { success: false, error: "This time slot is full" }
  }

  // Create booking
  const booking: Booking = {
    id: generateBookingId(),
    date: data.date,
    timeSlot: data.timeSlot,
    customerName: data.customerName,
    phone: data.phone,
    vehicleNo: data.vehicleNo,
    status: "Waiting",
    createdAt: new Date().toISOString(),
  }

  bookings.push(booking)
  slot.bookedCount++

  return { success: true, booking }
}

export function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): { success: boolean; error?: string } {
  const booking = bookings.find((b) => b.id === bookingId)
  if (!booking) {
    return { success: false, error: "Booking not found" }
  }

  // If cancelling, decrement slot count
  if (status === "Cancelled" && booking.status !== "Cancelled") {
    const slots = serviceSlots.filter(
      (s) => s.date === booking.date && s.slotTime === booking.timeSlot
    )
    if (slots.length > 0) {
      slots[0].bookedCount = Math.max(0, slots[0].bookedCount - 1)
    }
  }

  booking.status = status
  return { success: true }
}

export function addCustomSlot(
  date: string,
  slotTime: string,
  maxCapacity: number = MAX_PER_SLOT
): { success: boolean; error?: string } {
  const existing = serviceSlots.find(
    (s) => s.date === date && s.slotTime === slotTime
  )
  if (existing) {
    return { success: false, error: "Slot already exists for this date and time" }
  }

  serviceSlots.push({
    id: `${date}-custom-${Date.now()}`,
    date,
    slotTime,
    maxCapacity,
    bookedCount: 0,
  })

  return { success: true }
}

export function removeSlot(
  date: string,
  slotTime: string
): { success: boolean; error?: string } {
  const idx = serviceSlots.findIndex(
    (s) => s.date === date && s.slotTime === slotTime
  )
  if (idx === -1) {
    return { success: false, error: "Slot not found" }
  }

  // Check if there are bookings for this slot
  const hasBookings = bookings.some(
    (b) => b.date === date && b.timeSlot === slotTime && b.status !== "Cancelled"
  )
  if (hasBookings) {
    return { success: false, error: "Cannot remove slot with active bookings" }
  }

  serviceSlots.splice(idx, 1)
  return { success: true }
}

export function updateSlotCapacity(
  date: string,
  slotTime: string,
  maxCapacity: number
): { success: boolean; error?: string } {
  const slot = serviceSlots.find((s) => s.date === date && s.slotTime === slotTime)
  if (!slot) {
    return { success: false, error: "Slot not found" }
  }

  if (maxCapacity < 1) {
    return { success: false, error: "Capacity must be at least 1" }
  }

  if (slot.bookedCount > maxCapacity) {
    return {
      success: false,
      error: `Cannot set capacity below booked count (${slot.bookedCount})`,
    }
  }

  slot.maxCapacity = maxCapacity
  return { success: true }
}
