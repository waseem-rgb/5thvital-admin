import { createClient } from '@/lib/supabase/server'
import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { getOrderStats } from '@/lib/actions/orders'
import Link from 'next/link'

interface DashboardStats {
  // Orders
  totalOrders: number
  newOrders: number
  confirmedOrders: number
  scheduledOrders: number
  completedOrders: number
  // Content
  totalPages: number
  totalPackages: number
  publishedPackages: number
  totalMedia: number
}

async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  // Get order stats
  const orderStats = await getOrderStats()

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
    totalOrders: orderStats.total,
    newOrders: orderStats.new,
    confirmedOrders: orderStats.confirmed,
    scheduledOrders: orderStats.scheduled,
    completedOrders: orderStats.completed,
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
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>

        {/* Orders Stats - Primary Focus */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Orders Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              color="blue"
              href="/orders"
            />
            <StatCard
              title="New Orders"
              value={stats.newOrders}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="green"
              href="/orders?status=new"
            />
            <StatCard
              title="Confirmed"
              value={stats.confirmedOrders}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="indigo"
              href="/orders?status=confirmed"
            />
            <StatCard
              title="Scheduled"
              value={stats.scheduledOrders}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              color="purple"
              href="/orders?status=scheduled"
            />
            <StatCard
              title="Completed"
              value={stats.completedOrders}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
              color="teal"
              href="/orders?status=completed"
            />
          </div>
        </div>

        {/* Content Stats */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Content Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Packages"
              value={`${stats.publishedPackages}/${stats.totalPackages}`}
              subtitle="Published"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              color="orange"
              href="/packages"
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
              href="/pages"
            />
            <StatCard
              title="Media Files"
              value={stats.totalMedia}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              color="pink"
              href="/media"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionLink href="/orders?status=new" label="View New Orders" highlight />
            <QuickActionLink href="/packages/new" label="Add Package" />
            <QuickActionLink href="/coupons" label="Manage Coupons" />
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
  href,
}: {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'teal' | 'pink'
  href?: string
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    teal: 'bg-teal-100 text-teal-600',
    pink: 'bg-pink-100 text-pink-600',
  }

  const content = (
    <div className={`card p-5 ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
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

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

function QuickActionLink({ href, label, highlight }: { href: string; label: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        highlight
          ? 'bg-primary-600 text-white hover:bg-primary-700'
          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
      }`}
    >
      {label}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}
