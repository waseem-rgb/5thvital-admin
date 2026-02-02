import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { canEdit } from '@/lib/types'
import TestsListClient from './TestsListClient'

export default async function TestsPage() {
  const { admin } = await checkAdmin()

  if (!admin) return null

  const isEditable = canEdit(admin.role)

  return (
    <AdminLayout title="Medical Tests" role={admin.role} email={admin.email}>
      <TestsListClient canEdit={isEditable} />
    </AdminLayout>
  )
}
