import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { canEdit } from '@/lib/types'
import { getCoupons } from '@/lib/actions/coupons'
import CouponsTable from './CouponsTable'

export default async function CouponsPage() {
  const { admin } = await checkAdmin()
  
  if (!admin) return null

  const { data: coupons, error } = await getCoupons()
  const isEditable = canEdit(admin.role)

  return (
    <AdminLayout title="Coupons" role={admin.role} email={admin.email}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Discount Coupons</h2>
            <p className="text-sm text-gray-600">
              Manage discount coupons for the booking portal
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Coupons Table */}
        <div className="card overflow-hidden">
          <CouponsTable coupons={coupons} canEdit={isEditable} />
        </div>
      </div>
    </AdminLayout>
  )
}
