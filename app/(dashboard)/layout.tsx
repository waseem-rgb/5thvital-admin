import { checkAdmin } from '@/lib/auth/requireAdmin'
import { redirect } from 'next/navigation'
import { NotAuthorized } from '@/components/layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { admin, isAuthenticated } = await checkAdmin()

  if (!isAuthenticated) {
    redirect('/login')
  }

  if (!admin) {
    return <NotAuthorized />
  }

  return <>{children}</>
}
