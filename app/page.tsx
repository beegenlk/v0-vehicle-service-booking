import Link from "next/link"
import { CalendarPlus, ListOrdered, Settings, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary">
            <Wrench className="size-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
            ServiceQ
          </h1>
          <p className="text-base text-muted-foreground text-pretty">
            Vehicle service booking and queue management system
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link href="/book">
            <Card className="group cursor-pointer transition-all hover:border-primary/40 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarPlus className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Book a Service</CardTitle>
                    <CardDescription>Schedule your vehicle service appointment</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/queue">
            <Card className="group cursor-pointer transition-all hover:border-primary/40 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-status-in-service/10">
                    <ListOrdered className="size-5 text-status-in-service" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Live Queue</CardTitle>
                    <CardDescription>View real-time service queue status</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin">
            <Card className="group cursor-pointer transition-all hover:border-primary/40 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Settings className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Admin Dashboard</CardTitle>
                    <CardDescription>Manage bookings and service slots</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg" className="w-full min-h-12 text-base">
            <Link href="/book">Book Now</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
