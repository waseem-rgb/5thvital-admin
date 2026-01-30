import { checkAdmin } from '@/lib/auth/requireAdmin'
import { redirect } from 'next/navigation'
import { NotAuthorized } from '@/components/layout'

// Debug logging helper - only logs when ADMIN_DEBUG=1
function debugLog(...args: unknown[]) {
  if (process.env.ADMIN_DEBUG === "1") {
    console.log("[DashboardLayout]", ...args)
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const result = await checkAdmin()

  // Debug log final decision (gated by ADMIN_DEBUG=1)
  debugLog("checkAdmin result:", {
    ok: result.ok,
    isAuthenticated: result.isAuthenticated,
    reason: result.reason,
    adminEmail: result.admin?.email,
    adminRole: result.admin?.role,
  })

  if (!result.isAuthenticated) {
    debugLog("Redirecting to /login - user not authenticated")
    redirect('/login')
  }

  if (!result.ok || !result.admin) {
    debugLog("Showing NotAuthorized - reason:", result.reason)
    return <NotAuthorized />
  }

  debugLog("Access granted to:", result.admin.email, "with role:", result.admin.role)
  return <>{children}</>
}
