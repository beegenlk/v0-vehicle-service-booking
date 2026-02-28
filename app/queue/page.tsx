"use client"

import useSWR from "swr"
import { cn } from "@/lib/utils"
import { getTodayStr } from "@/lib/dates"
import { AppHeader } from "@/components/app-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { Radio, Clock, Car, Loader2 } from "lucide-react"

interface Booking {
  id: string
  date: string
  timeSlot: string
  customerName: string
  phone: string
  vehicleNo: string
  status: "Waiting" | "Arrived" | "InService" | "Completed"
}

interface QueueData {
  bookings: Booking[]
  nowServing: Booking | null
  nextUp: Booking[]
  stats: {
    total: number
    waiting: number
    arrived: number
    inService: number
    completed: number
  }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const statusConfig = {
  Waiting: {
    label: "Waiting",
    colorClass: "bg-status-waiting text-white",
    dotClass: "bg-status-waiting",
  },
  Arrived: {
    label: "Arrived",
    colorClass: "bg-status-arrived text-white",
    dotClass: "bg-status-arrived",
  },
  InService: {
    label: "In Service",
    colorClass: "bg-status-in-service text-white",
    dotClass: "bg-status-in-service",
  },
  Completed: {
    label: "Completed",
    colorClass: "bg-status-completed text-white",
    dotClass: "bg-status-completed",
  },
}

function StatusBadge({ status }: { status: Booking["status"] }) {
  const config = statusConfig[status]
  return (
    <Badge className={cn("text-xs font-medium", config.colorClass)}>
      {config.label}
    </Badge>
  )
}

function QueueItem({ booking }: { booking: Booking }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-all">
      <div
        className={cn(
          "size-2.5 shrink-0 rounded-full",
          statusConfig[booking.status].dotClass
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary">{booking.id}</span>
          <StatusBadge status={booking.status} />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Car className="size-3" />
            {booking.vehicleNo}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {booking.timeSlot}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function QueuePage() {
  const todayStr = getTodayStr()
  const { data, isLoading } = useSWR<QueueData>(
    `/api/queue?date=${todayStr}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const bookings = data?.bookings || []
  const stats = data?.stats || { total: 0, waiting: 0, arrived: 0, inService: 0, completed: 0 }
  const nowServing = data?.nowServing
  const nextUp = data?.nextUp || []

  // Group bookings by time slot
  const grouped: Record<string, Booking[]> = {}
  bookings.forEach((b) => {
    if (!grouped[b.timeSlot]) grouped[b.timeSlot] = []
    grouped[b.timeSlot].push(b)
  })

  const sortedSlots = Object.keys(grouped).sort((a, b) => a.localeCompare(b))

  return (
    <div className="min-h-svh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-lg bg-status-in-service/10">
            <Radio className="size-5 text-status-in-service" />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-status-in-service animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Live Queue</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Loading queue...</p>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="mb-6 grid grid-cols-4 gap-2">
              {[
                { label: "Total", value: stats.total, color: "text-foreground" },
                { label: "Waiting", value: stats.waiting + stats.arrived, color: "text-status-waiting" },
                { label: "Servicing", value: stats.inService, color: "text-status-in-service" },
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

            {/* Now Serving */}
            {nowServing && (
              <Card className="mb-4 border-status-in-service/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <span
                      className="size-2 rounded-full animate-pulse"
                      style={{ backgroundColor: "var(--status-in-service)" }}
                    />
                    Now Serving
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-foreground">{nowServing.id}</p>
                      <p className="text-sm text-muted-foreground">{nowServing.vehicleNo}</p>
                    </div>
                    <StatusBadge status={nowServing.status} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Up */}
            {nextUp.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Next Up
                </h3>
                <div className="flex flex-col gap-2">
                  {nextUp.map((b) => (
                    <QueueItem key={b.id} booking={b} />
                  ))}
                </div>
              </div>
            )}

            {/* Queue by Time Slot */}
            {bookings.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
                  <Clock className="size-6 text-muted-foreground" />
                </div>
                <p className="text-base font-medium text-foreground">No bookings yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Today&apos;s queue is empty. Check back later.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  All Bookings
                </h3>
                {sortedSlots.map((slot) => (
                  <div key={slot}>
                    <div className="mb-2 flex items-center gap-2">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{slot}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {grouped[slot].map((b) => (
                        <QueueItem key={b.id} booking={b} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Auto-refresh notice */}
            <p className="mt-8 text-center text-xs text-muted-foreground">
              Auto-refreshes every 30 seconds
            </p>
          </>
        )}
      </main>
    </div>
  )
}
