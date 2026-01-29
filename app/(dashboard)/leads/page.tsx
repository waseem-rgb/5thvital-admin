import { createClient } from '@/lib/supabase/server'
import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { Lead, canEdit } from '@/lib/types'
import LeadsTable from './LeadsTable'

async function getLeads(): Promise<Lead[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
    return []
  }

  return data || []
}

export default async function LeadsPage() {
  const { admin } = await checkAdmin()
  const leads = await getLeads()

  if (!admin) return null

  const isEditable = canEdit(admin.role)

  return (
    <AdminLayout title="Leads" role={admin.role} email={admin.email}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Leads</h2>
            <p className="text-sm text-gray-600">
              {leads.length} total lead{leads.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Leads Table */}
        <div className="card overflow-hidden">
          <LeadsTable leads={leads} canEdit={isEditable} />
        </div>
      </div>
    </AdminLayout>
  )
}
