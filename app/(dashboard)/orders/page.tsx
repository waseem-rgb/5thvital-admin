import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { canEdit } from '@/lib/types'
import { getOrders, OrderStatus } from '@/lib/actions/orders'
import OrdersTable from './OrdersTable'

interface SearchParams {
  status?: string
  search?: string
  page?: string
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { admin } = await checkAdmin()
  
  if (!admin) return null

  const params = await searchParams
  const status = params.status as OrderStatus | undefined
  const search = params.search
  const page = parseInt(params.page || '1', 10)

  const { data: orders, total, error } = await getOrders({
    status,
    search,
    page,
    pageSize: 50,
  })

  const isEditable = canEdit(admin.role)

  return (
    <AdminLayout title="Orders" role={admin.role} email={admin.email}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Orders</h2>
            <p className="text-sm text-gray-600">
              {total} total order{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Orders Table with Search & Filter */}
        <div className="card overflow-hidden">
          <OrdersTable 
            orders={orders} 
            total={total}
            canEdit={isEditable}
            currentPage={page}
            currentStatus={status}
            currentSearch={search}
          />
        </div>
      </div>
    </AdminLayout>
  )
}
