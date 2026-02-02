import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { canEdit } from '@/lib/types'
import { getOrderById } from '@/lib/actions/orders'
import OrderDetailClient from './OrderDetailClient'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { admin } = await checkAdmin()
  
  if (!admin) return null

  const { id } = await params
  const { data: order, error } = await getOrderById(id)
  const isEditable = canEdit(admin.role)

  return (
    <AdminLayout title="Order Details" role={admin.role} email={admin.email}>
      <div className="space-y-6">
        {/* Back link */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Orders
        </Link>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Order not found */}
        {!error && !order && (
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
            Order not found
          </div>
        )}

        {/* Order details */}
        {order && (
          <OrderDetailClient order={order} canEdit={isEditable} />
        )}
      </div>
    </AdminLayout>
  )
}
