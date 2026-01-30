import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { canEdit } from '@/lib/types'
import { redirect } from 'next/navigation'
import { getPackageById } from '@/lib/actions/packages'
import PackageForm from '../PackageForm'
import Link from 'next/link'

interface EditPackagePageProps {
  params: Promise<{ id: string }>
}

export default async function EditPackagePage({ params }: EditPackagePageProps) {
  const { admin } = await checkAdmin()
  const { id } = await params

  if (!admin) return null

  // Only editors and above can edit packages
  if (!canEdit(admin.role)) {
    redirect('/packages')
  }

  // Fetch the package
  const { data: pkg, error } = await getPackageById(id)

  // Handle not found
  if (error || !pkg) {
    return (
      <AdminLayout title="Package Not Found" role={admin.role} email={admin.email}>
        <div className="max-w-4xl">
          <div className="card p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Package Not Found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {error || 'The package you are looking for does not exist or has been deleted.'}
            </p>
            <Link
              href="/packages"
              className="mt-6 inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              ← Back to Packages
            </Link>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={`Edit: ${pkg.title}`} role={admin.role} email={admin.email}>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Edit Package</h2>
          <p className="text-sm text-gray-600">
            Update the package details below
          </p>
        </div>

        {/* Form */}
        <PackageForm package={pkg} mode="edit" />
      </div>
    </AdminLayout>
  )
}
