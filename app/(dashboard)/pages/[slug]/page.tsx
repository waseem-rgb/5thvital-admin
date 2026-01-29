import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { canEdit } from '@/lib/types'
import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/lib/actions/pages'
import PageEditor from './PageEditor'

interface PageEditorPageProps {
  params: Promise<{ slug: string }>
}

export default async function PageEditorPage({ params }: PageEditorPageProps) {
  const { slug } = await params
  const { admin } = await checkAdmin()
  
  if (!admin) return null

  const { data: page, error } = await getPageBySlug(slug)

  if (error || !page) {
    notFound()
  }

  const isEditable = canEdit(admin.role)

  return (
    <AdminLayout title={`Edit: ${page.title}`} role={admin.role} email={admin.email}>
      <PageEditor page={page} canEdit={isEditable} />
    </AdminLayout>
  )
}
