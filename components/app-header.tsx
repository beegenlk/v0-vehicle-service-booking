"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { CalendarPlus, ListOrdered, LogIn, Wrench } from "lucide-react"

const navItems = [
  { href: "/book", label: "Book", icon: CalendarPlus },
  { href: "/queue", label: "Queue", icon: ListOrdered },
]

export function AppHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Wrench className="size-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">
            ServiceQ
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="size-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
          <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
              pathname === "/admin"
                ? "text-foreground"
                : "text-muted-foreground/60 hover:text-muted-foreground"
            )}
            title="Admin Login"
          >
            <LogIn className="size-3.5" />
            <span className="sr-only">Admin Login</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
