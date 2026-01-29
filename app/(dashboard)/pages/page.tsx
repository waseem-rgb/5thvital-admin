import { createClient } from '@/lib/supabase/server'
import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { Page, canEdit } from '@/lib/types'
import PagesListClient from './PagesListClient'

async function getPages(): Promise<Page[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .order('slug', { ascending: true })

  if (error) {
    console.error('Error fetching pages:', error)
    return []
  }

  return data || []
}

export default async function PagesListPage() {
  const { admin } = await checkAdmin()
  const pages = await getPages()

  if (!admin) return null

  const isEditable = canEdit(admin.role)

  return (
    <AdminLayout title="Pages" role={admin.role} email={admin.email}>
      <PagesListClient pages={pages} canEdit={isEditable} />
    </AdminLayout>
  )
}
