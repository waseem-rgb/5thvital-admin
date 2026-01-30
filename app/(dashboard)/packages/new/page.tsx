import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { canEdit } from '@/lib/types'
import { redirect } from 'next/navigation'
import PackageForm from '../PackageForm'

export default async function NewPackagePage() {
  const { admin } = await checkAdmin()

  if (!admin) return null

  // Only editors and above can create packages
  if (!canEdit(admin.role)) {
    redirect('/packages')
  }

  return (
    <AdminLayout title="New Package" role={admin.role} email={admin.email}>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Create New Package</h2>
          <p className="text-sm text-gray-600">
            Fill in the details below to create a new health package
          </p>
        </div>

        {/* Form */}
        <PackageForm mode="create" />
      </div>
    </AdminLayout>
  )
}
