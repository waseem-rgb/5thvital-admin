import { createClient } from '@/lib/supabase/server'
import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { Admin, canManageUsers } from '@/lib/types'
import { redirect } from 'next/navigation'
import UsersTable from './UsersTable'
import AddAdminModal from './AddAdminModal'

async function getAdmins(): Promise<Admin[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admins:', error)
    return []
  }

  return data || []
}

export default async function UsersPage() {
  const { admin } = await checkAdmin()

  if (!admin) return null

  // Only super_admin can access this page
  if (!canManageUsers(admin.role)) {
    redirect('/')
  }

  const admins = await getAdmins()

  return (
    <AdminLayout title="Users" role={admin.role} email={admin.email}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Admin Users</h2>
            <p className="text-sm text-gray-600">
              Manage who can access the admin dashboard
            </p>
          </div>
          <AddAdminModal />
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <UsersTable admins={admins} currentAdminId={admin.id} />
        </div>

        {/* Instructions */}
        <div className="card p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">How to add a new admin</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>First, create a user in Supabase Auth (via Supabase dashboard or your public website&apos;s sign-up)</li>
            <li>Copy the user&apos;s UUID from the Supabase Auth users table</li>
            <li>Click &quot;Add Admin&quot; above and paste the UUID with their email and role</li>
          </ol>
        </div>
      </div>
    </AdminLayout>
  )
}
