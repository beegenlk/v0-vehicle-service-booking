"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { AdminLogin } from "@/components/admin-login"
import { AdminDashboardContent } from "@/components/admin-dashboard"

export default function AdminPage() {
  const [password, setPassword] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)

  async function handleLogin(pw: string) {
    // Verify password by making a test request
    try {
      const res = await fetch(`/api/admin?date=2025-01-01`, {
        headers: { "x-admin-password": pw },
      })

      if (res.status === 401) {
        setLoginError("Incorrect password. Try again.")
        return
      }

      setPassword(pw)
      setLoginError(null)
    } catch {
      setLoginError("Failed to connect. Please try again.")
    }
  }

  function handleLogout() {
    setPassword(null)
    setLoginError(null)
  }

  return (
    <div className="min-h-svh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6">
        {password ? (
          <AdminDashboardContent password={password} onLogout={handleLogout} />
        ) : (
          <AdminLogin onLogin={handleLogin} error={loginError} />
        )}
      </main>
    </div>
  )
}
