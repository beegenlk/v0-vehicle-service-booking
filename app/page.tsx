import Link from "next/link"
import { CalendarPlus, ListOrdered, LogIn, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Wrench className="size-4 text-primary-foreground" />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              ServiceQ
            </span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogIn className="size-3.5" />
            <span>Admin</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
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
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg" className="w-full min-h-12 text-base">
            <Link href="/book">Book Now</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
