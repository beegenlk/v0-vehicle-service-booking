"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getNext7Days } from "@/lib/dates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Clock,
  Car,
  Phone,
  User,
  LogOut,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
  Wrench,
  XCircle,
  ArrowRight,
} from "lucide-react"

interface Booking {
  id: string
  date: string
  timeSlot: string
  customerName: string
  phone: string
  vehicleNo: string
  status: "Waiting" | "Arrived" | "InService" | "Completed" | "Cancelled"
  createdAt: string
}

interface ServiceSlot {
  id: string
  date: string
  slotTime: string
  maxCapacity: number
  bookedCount: number
}

interface AdminData {
  bookings: Booking[]
  slots: ServiceSlot[]
  stats: {
    total: number
    waiting: number
    arrived: number
    inService: number
    completed: number
    cancelled: number
  }
}

const statusConfig = {
  Waiting: {
    label: "Waiting",
    colorClass: "bg-status-waiting text-white",
    icon: Circle,
  },
  Arrived: {
    label: "Arrived",
    colorClass: "bg-status-arrived text-white",
    icon: CheckCircle2,
  },
  InService: {
    label: "In Service",
    colorClass: "bg-status-in-service text-white",
    icon: Wrench,
  },
  Completed: {
    label: "Completed",
    colorClass: "bg-status-completed text-white",
    icon: CheckCircle2,
  },
  Cancelled: {
    label: "Cancelled",
    colorClass: "bg-status-cancelled text-white",
    icon: XCircle,
  },
}

interface AdminDashboardContentProps {
  password: string
  onLogout: () => void
}

export function AdminDashboardContent({ password, onLogout }: AdminDashboardContentProps) {
  const days = getNext7Days()
  const [selectedDate, setSelectedDate] = useState(days[0].dateStr)
  const [addSlotOpen, setAddSlotOpen] = useState(false)
  const [newSlotTime, setNewSlotTime] = useState("")
  const [addingSlot, setAddingSlot] = useState(false)

  const fetcher = (url: string) =>
    fetch(url, { headers: { "x-admin-password": password } }).then((r) => {
      if (r.status === 401) throw new Error("Unauthorized")
      return r.json()
    })

  const { data, isLoading, mutate } = useSWR<AdminData>(
    `/api/admin?date=${selectedDate}`,
    fetcher,
    { refreshInterval: 10000 }
  )

  const bookings = data?.bookings || []
  const slots = data?.slots || []
  const stats = data?.stats || {
    total: 0,
    waiting: 0,
    arrived: 0,
    inService: 0,
    completed: 0,
    cancelled: 0,
  }

  // Group bookings by time slot
  const grouped: Record<string, Booking[]> = {}
  bookings.forEach((b) => {
    if (!grouped[b.timeSlot]) grouped[b.timeSlot] = []
    grouped[b.timeSlot].push(b)
  })

  const sortedSlots = slots
    .map((s) => s.slotTime)
    .sort((a, b) => a.localeCompare(b))

  async function updateStatus(bookingId: string, status: Booking["status"]) {
    try {
      const res = await fetch("/api/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ bookingId, status }),
      })

      if (!res.ok) {
        const result = await res.json()
        toast.error(result.error || "Failed to update status")
        return
      }

      toast.success(`Status updated to ${status}`)
      mutate()
    } catch {
      toast.error("Failed to update status")
    }
  }

  async function handleAddSlot() {
    if (!newSlotTime) {
      toast.error("Please enter a time")
      return
    }

    setAddingSlot(true)
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          action: "addSlot",
          date: selectedDate,
          slotTime: newSlotTime,
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Failed to add slot")
        return
      }

      toast.success("Slot added successfully")
      setAddSlotOpen(false)
      setNewSlotTime("")
      mutate()
    } catch {
      toast.error("Failed to add slot")
    } finally {
      setAddingSlot(false)
    }
  }

  async function handleRemoveSlot(slotTime: string) {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          action: "removeSlot",
          date: selectedDate,
          slotTime,
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Failed to remove slot")
        return
      }

      toast.success("Slot removed")
      mutate()
    } catch {
      toast.error("Failed to remove slot")
    }
  }

  function getNextStatus(current: Booking["status"]): Booking["status"] | null {
    const flow: Record<string, Booking["status"]> = {
      Waiting: "Arrived",
      Arrived: "InService",
      InService: "Completed",
    }
    return flow[current] || null
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage bookings and slots</p>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>

      {/* Date Selection */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {days.map((day) => (
          <button
            key={day.dateStr}
            type="button"
            onClick={() => setSelectedDate(day.dateStr)}
            className={cn(
              "flex shrink-0 flex-col items-center rounded-xl border px-4 py-2.5 text-sm transition-all min-w-[88px]",
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

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Waiting", value: stats.waiting, color: "text-status-waiting" },
          { label: "Arrived", value: stats.arrived, color: "text-status-arrived" },
          { label: "In Service", value: stats.inService, color: "text-status-in-service" },
          { label: "Done", value: stats.completed, color: "text-status-completed" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center rounded-xl border bg-card p-3"
          >
            <span className={cn("text-xl font-bold", s.color)}>{s.value}</span>
            <span className="text-[11px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading bookings...</p>
        </div>
      ) : (
        <>
          {/* Slot Management */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Time Slots ({slots.length})
            </h2>
            <Dialog open={addSlotOpen} onOpenChange={setAddSlotOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="size-4" />
                  Add Slot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Time Slot</DialogTitle>
                  <DialogDescription>
                    Add a custom time slot for {days.find((d) => d.dateStr === selectedDate)?.label || selectedDate}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-4">
                  <Label htmlFor="slotTime">Slot Time (e.g., 6:00 PM)</Label>
                  <Input
                    id="slotTime"
                    placeholder="e.g., 6:00 PM"
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddSlotOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSlot} disabled={addingSlot}>
                    {addingSlot ? "Adding..." : "Add Slot"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Slot pills */}
          <div className="flex flex-wrap gap-2">
            {slots
              .sort((a, b) => a.slotTime.localeCompare(b.slotTime))
              .map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm"
                >
                  <Clock className="size-3 text-muted-foreground" />
                  <span className="font-medium text-foreground">{slot.slotTime}</span>
                  <span className="text-xs text-muted-foreground">
                    ({slot.bookedCount}/{slot.maxCapacity})
                  </span>
                  {slot.bookedCount === 0 && (
                    <button
                      onClick={() => handleRemoveSlot(slot.slotTime)}
                      className="ml-1 rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Remove ${slot.slotTime} slot`}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
              ))}
          </div>

          {/* Bookings by Slot */}
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
                <Clock className="size-6 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground">No bookings yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No one has booked for this date yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sortedSlots.map((slotTime) => {
                const slotBookings = grouped[slotTime]
                if (!slotBookings || slotBookings.length === 0) return null

                return (
                  <div key={slotTime}>
                    <div className="mb-2 flex items-center gap-2">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">
                        {slotTime}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({slotBookings.length} booking{slotBookings.length !== 1 ? "s" : ""})
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {slotBookings.map((booking) => {
                        const nextStatus = getNextStatus(booking.status)
                        const config = statusConfig[booking.status]

                        return (
                          <Card key={booking.id} className="py-3">
                            <CardContent className="flex flex-col gap-3 px-4">
                              {/* Header row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-primary">
                                    {booking.id}
                                  </span>
                                  <Badge
                                    className={cn(
                                      "text-xs font-medium",
                                      config.colorClass
                                    )}
                                  >
                                    {config.label}
                                  </Badge>
                                </div>
                              </div>

                              {/* Details */}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Car className="size-3.5" />
                                  <span className="font-medium text-foreground">
                                    {booking.vehicleNo}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <User className="size-3.5" />
                                  <span className="text-foreground">
                                    {booking.customerName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                  <Phone className="size-3.5" />
                                  <span className="text-foreground">{booking.phone}</span>
                                </div>
                              </div>

                              {/* Action buttons */}
                              {booking.status !== "Completed" &&
                                booking.status !== "Cancelled" && (
                                  <div className="flex flex-wrap gap-2">
                                    {nextStatus && (
                                      <Button
                                        size="sm"
                                        onClick={() => updateStatus(booking.id, nextStatus)}
                                        className="min-h-9"
                                      >
                                        <ArrowRight className="size-3.5" />
                                        {nextStatus === "Arrived"
                                          ? "Mark Arrived"
                                          : nextStatus === "InService"
                                            ? "Start Service"
                                            : "Complete"}
                                      </Button>
                                    )}
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        updateStatus(booking.id, "Cancelled")
                                      }
                                      className="min-h-9"
                                    >
                                      <XCircle className="size-3.5" />
                                      Cancel
                                    </Button>
                                  </div>
                                )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
