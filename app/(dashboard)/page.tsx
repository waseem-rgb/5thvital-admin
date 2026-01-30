import { createClient } from '@/lib/supabase/server'
import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'

interface DashboardStats {
  totalLeads: number
  newLeads: number
  totalPages: number
  totalPackages: number
  publishedPackages: number
  totalMedia: number
}

async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  // Get leads count
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })

  const { count: newLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')

  // Get pages count
  const { count: totalPages } = await supabase
    .from('pages')
    .select('*', { count: 'exact', head: true })

  // Get packages count
  const { count: totalPackages } = await supabase
    .from('packages')
    .select('*', { count: 'exact', head: true })

  const { count: publishedPackages } = await supabase
    .from('packages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  // Get media count
  const { count: totalMedia } = await supabase
    .from('media')
    .select('*', { count: 'exact', head: true })

  return {
    totalLeads: totalLeads || 0,
    newLeads: newLeads || 0,
    totalPages: totalPages || 0,
    totalPackages: totalPackages || 0,
    publishedPackages: publishedPackages || 0,
    totalMedia: totalMedia || 0,
  }
}

export default async function DashboardPage() {
  const { admin } = await checkAdmin()
  const stats = await getDashboardStats()

  if (!admin) return null

  return (
    <AdminLayout title="Dashboard" role={admin.role} email={admin.email}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Welcome back, {admin.email.split('@')[0]}!
          </h2>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening with your website today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Leads"
            value={stats.totalLeads}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            title="New Leads"
            value={stats.newLeads}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
            color="green"
          />
          <StatCard
            title="Pages"
            value={stats.totalPages}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            color="purple"
          />
          <StatCard
            title="Packages"
            value={`${stats.publishedPackages}/${stats.totalPackages}`}
            subtitle="Published"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
            color="indigo"
          />
          <StatCard
            title="Media Files"
            value={stats.totalMedia}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionLink href="/leads" label="View Leads" />
            <QuickActionLink href="/pages" label="Manage Pages" />
            <QuickActionLink href="/media" label="Browse Media" />
            <QuickActionLink href="/settings" label="Settings" />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function QuickActionLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
    >
      {label}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  )
}
