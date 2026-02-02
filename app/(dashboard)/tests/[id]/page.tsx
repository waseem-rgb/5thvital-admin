import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { canEdit } from '@/lib/types'
import { getTestById } from '@/lib/actions/tests'
import { notFound } from 'next/navigation'
import TestDetailClient from './TestDetailClient'

interface TestDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TestDetailPage({ params }: TestDetailPageProps) {
  const { id } = await params
  const { admin } = await checkAdmin()
  
  if (!admin) return null

  const { data: test, error } = await getTestById(id)

  if (error || !test) {
    notFound()
  }

  const isEditable = canEdit(admin.role)

  return (
    <AdminLayout title={test.test_name} role={admin.role} email={admin.email}>
      <TestDetailClient test={test} canEdit={isEditable} />
    </AdminLayout>
  )
}
