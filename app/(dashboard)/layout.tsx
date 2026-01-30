import { checkAdmin } from '@/lib/auth/requireAdmin'
import { redirect } from 'next/navigation'
import { NotAuthorized } from '@/components/layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const result = await checkAdmin()

  // Log final decision for debugging
  console.log('[DashboardLayout] checkAdmin result:', {
    ok: result.ok,
    isAuthenticated: result.isAuthenticated,
    reason: result.reason,
    adminEmail: result.admin?.email,
    adminRole: result.admin?.role,
  })

  if (!result.isAuthenticated) {
    redirect('/login')
  }

  if (!result.ok || !result.admin) {
    return <NotAuthorized />
  }

  return <>{children}</>
}
