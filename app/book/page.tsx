"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getNext7Days } from "@/lib/dates"
import { validatePhone, validateVehicleNumber, validateBookingForm } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AppHeader } from "@/components/app-header"
import { CalendarPlus, CheckCircle2, Clock, User, Phone, Car, AlertCircle } from "lucide-react"

interface ServiceSlot {
  id: string
  date: string
  slotTime: string
  maxCapacity: number
  bookedCount: number
}

interface BookingConfirmation {
  id: string
  date: string
  timeSlot: string
  customerName: string
  vehicleNo: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function BookingPage() {
  const days = getNext7Days()
  const [selectedDate, setSelectedDate] = useState(days[0].dateStr)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [phone, setPhone] = useState("")
  const [vehicleNo, setVehicleNo] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data, mutate } = useSWR(`/api/bookings?date=${selectedDate}`, fetcher, {
    refreshInterval: 15000,
  })

  const slots: ServiceSlot[] = data?.slots ?? []

  function handleDateChange(dateStr: string) {
    setSelectedDate(dateStr)
    setSelectedSlot(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedSlot) {
      toast.error("Please select a time slot")
      return
    }

    const validation = validateBookingForm(customerName, phone, vehicleNo)
    
    if (!validation.valid) {
      setErrors(validation.errors)
      const errorMessages = Object.values(validation.errors)
      if (errorMessages.length > 0) {
        toast.error(errorMessages[0])
      }
      return
    }

    setErrors({})
    setShowConfirmDialog(true)
  }

  async function confirmBooking() {
    setSubmitting(true)
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          timeSlot: selectedSlot,
          customerName: customerName.trim(),
          phone: phone.trim(),
          vehicleNo: vehicleNo.trim().toUpperCase(),
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || "Failed to create booking")
        setShowConfirmDialog(false)
        return
      }

      setShowConfirmDialog(false)
      setConfirmation({
        id: result.booking.id,
        date: selectedDate,
        timeSlot: selectedSlot,
        customerName: customerName.trim(),
        vehicleNo: vehicleNo.trim().toUpperCase(),
      })
      toast.success("Booking confirmed!")
      mutate()
    } catch {
      toast.error("Something went wrong. Please try again.")
      setShowConfirmDialog(false)
    } finally {
      setSubmitting(false)
    }
  }

  function handleNewBooking() {
    setConfirmation(null)
    setSelectedSlot(null)
    setCustomerName("")
    setPhone("")
    setVehicleNo("")
    setErrors({})
  }

  function handlePhoneChange(value: string) {
    setPhone(value)
    if (errors.phone) {
      const validation = validatePhone(value)
      setErrors((prev) => {
        const newErrors = { ...prev }
        if (validation.valid) {
          delete newErrors.phone
        } else {
          newErrors.phone = validation.error || "Invalid phone number"
        }
        return newErrors
      })
    }
  }

  function handleVehicleChange(value: string) {
    setVehicleNo(value)
    if (errors.vehicle) {
      const validation = validateVehicleNumber(value)
      setErrors((prev) => {
        const newErrors = { ...prev }
        if (validation.valid) {
          delete newErrors.vehicle
        } else {
          newErrors.vehicle = validation.error || "Invalid vehicle number"
        }
        return newErrors
      })
    }
  }

  if (confirmation) {
    return (
      <div className="min-h-svh bg-background">
        <AppHeader />
        <main className="mx-auto max-w-lg px-4 py-8">
          <Card className="border-status-completed/30">
            <CardHeader className="items-center text-center">
              <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-status-completed/10">
                <CheckCircle2 className="size-8" style={{ color: "var(--status-completed)" }} />
              </div>
              <CardTitle className="text-xl">Booking Confirmed</CardTitle>
              <CardDescription>Your service appointment has been booked</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-lg bg-muted p-4">
                <dl className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Booking ID</dt>
                    <dd className="font-semibold text-foreground">{confirmation.id}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Date</dt>
                    <dd className="font-medium text-foreground">
                      {days.find((d) => d.dateStr === confirmation.date)?.label || confirmation.date}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Time Slot</dt>
                    <dd className="font-medium text-foreground">{confirmation.timeSlot}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium text-foreground">{confirmation.customerName}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Vehicle</dt>
                    <dd className="font-medium text-foreground">{confirmation.vehicleNo}</dd>
                  </div>
                </dl>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={handleNewBooking} className="min-h-11">
                  Book Another
                </Button>
                <Button variant="outline" asChild className="min-h-11">
                  <a href="/queue">View Live Queue</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <CalendarPlus className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Book a Service</h1>
            <p className="text-sm text-muted-foreground">Select a date and time slot</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Date Selection */}
          <section>
            <Label className="mb-3 block text-sm font-medium text-foreground">
              Select Date
            </Label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {days.map((day) => (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => handleDateChange(day.dateStr)}
                  className={cn(
                    "flex shrink-0 flex-col items-center rounded-xl border px-4 py-3 text-sm transition-all min-w-[88px]",
                    selectedDate === day.dateStr
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  )}
                >
                  <span className="font-semibold">{day.label.split(",")[0]}</span>
                  {day.label.includes(",") && (
                    <span className="mt-0.5 text-xs opacity-80">
                      {day.label.split(",")[1]?.trim()}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Time Slot Selection */}
          <section>
            <Label className="mb-3 block text-sm font-medium text-foreground">
              Available Slots
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((slot) => {
                const available = slot.maxCapacity - slot.bookedCount
                const isFull = available <= 0
                const isSelected = selectedSlot === slot.slotTime

                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={isFull}
                    onClick={() => setSelectedSlot(slot.slotTime)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition-all",
                      isFull
                        ? "cursor-not-allowed border-border bg-muted/50 text-muted-foreground opacity-60"
                        : isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card text-foreground hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      <span className="font-semibold">{slot.slotTime}</span>
                    </div>
                    {isFull ? (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        FULL
                      </Badge>
                    ) : (
                      <span className={cn("text-xs", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {available} slot{available !== 1 ? "s" : ""} left
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Customer Details */}
          <section className="flex flex-col gap-4">
            <Label className="block text-sm font-medium text-foreground">
              Your Details
            </Label>

            <div className="relative">
              <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Full Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="pl-10 min-h-11"
                required
              />
            </div>

            <div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Phone Number (10 digits starting with 0)"
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={cn("pl-10 min-h-11", errors.phone && "border-destructive focus-visible:ring-destructive")}
                  required
                />
              </div>
              {errors.phone && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  <span>{errors.phone}</span>
                </div>
              )}
            </div>

            <div>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Vehicle Number (e.g., AB-1234)"
                  value={vehicleNo}
                  onChange={(e) => handleVehicleChange(e.target.value.toUpperCase())}
                  className={cn("pl-10 min-h-11", errors.vehicle && "border-destructive focus-visible:ring-destructive")}
                  required
                />
              </div>
              {errors.vehicle && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  <span>{errors.vehicle}</span>
                </div>
              )}
            </div>
          </section>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            disabled={submitting || !selectedSlot}
            className="min-h-12 text-base font-semibold"
          >
            {submitting ? "Booking..." : "Book Now"}
          </Button>
        </form>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Your Booking</DialogTitle>
              <DialogDescription>
                Please review your details before confirming
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Date:</span>
                <span className="font-semibold text-foreground">
                  {days.find((d) => d.dateStr === selectedDate)?.label || selectedDate}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Time:</span>
                <span className="font-semibold text-foreground">{selectedSlot}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Name:</span>
                <span className="font-semibold text-foreground">{customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Phone:</span>
                <span className="font-semibold text-foreground">{phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Vehicle:</span>
                <span className="font-semibold text-foreground">{vehicleNo.toUpperCase()}</span>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmBooking}
                disabled={submitting}
                className="min-h-11"
              >
                {submitting ? "Confirming..." : "Confirm Booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
