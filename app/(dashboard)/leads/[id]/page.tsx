import { createClient } from '@/lib/supabase/server'
import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { Lead, canEdit } from '@/lib/types'
import { notFound } from 'next/navigation'
import LeadDetailClient from './LeadDetailClient'

interface LeadDetailPageProps {
  params: Promise<{ id: string }>
}

async function getLead(id: string): Promise<Lead | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching lead:', error)
    return null
  }

  return data
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params
  const { admin } = await checkAdmin()
  const lead = await getLead(id)

  if (!admin) return null
  if (!lead) notFound()

  const isEditable = canEdit(admin.role)

  return (
    <AdminLayout title={`Lead: ${lead.name}`} role={admin.role} email={admin.email}>
      <LeadDetailClient lead={lead} canEdit={isEditable} />
    </AdminLayout>
  )
}
