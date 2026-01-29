import { createClient } from '@/lib/supabase/server'
import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { Setting, canEditSettings } from '@/lib/types'
import SettingsForm from './SettingsForm'

async function getSettings(): Promise<Setting[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('key', { ascending: true })

  if (error) {
    console.error('Error fetching settings:', error)
    return []
  }

  return data || []
}

export default async function SettingsPage() {
  const { admin } = await checkAdmin()
  const settings = await getSettings()

  if (!admin) return null

  const canEdit = canEditSettings(admin.role)

  return (
    <AdminLayout title="Settings" role={admin.role} email={admin.email}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Site Settings</h2>
            <p className="text-sm text-gray-600">
              Configure global settings for your website
            </p>
          </div>
        </div>

        {/* Settings List */}
        <SettingsForm settings={settings} canEdit={canEdit} />

        {!canEdit && (
          <div className="card p-4 bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-800">
              You have read-only access to settings. Contact a super admin to make changes.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
