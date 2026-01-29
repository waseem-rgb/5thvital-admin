'use client'

import { useState } from 'react'
import { Admin, AdminRole } from '@/lib/types'
import { createClient } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'

interface UsersTableProps {
  admins: Admin[]
  currentAdminId: string
}

const roleOptions: AdminRole[] = ['super_admin', 'editor', 'viewer']

export default function UsersTable({ admins, currentAdminId }: UsersTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<AdminRole>('viewer')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleEditRole = (admin: Admin) => {
    setEditingId(admin.id)
    setEditRole(admin.role)
  }

  const handleSaveRole = async (id: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('admins')
        .update({ role: editRole, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setEditingId(null)
      router.refresh()
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} as an admin?`)) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert('Failed to remove admin')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRoleBadgeClass = (role: AdminRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800'
      case 'editor':
        return 'bg-blue-100 text-blue-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (admins.length === 0) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-1">No admins found</h3>
        <p className="text-gray-600">Add the first admin to get started.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
            <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
            <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Added</th>
            <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {admins.map((admin) => (
            <tr key={admin.id} className="hover:bg-gray-50">
              <td className="py-3">
                <span className="font-medium text-gray-900">{admin.email}</span>
                {admin.id === currentAdminId && (
                  <span className="ml-2 text-xs text-primary-600">(you)</span>
                )}
              </td>
              <td>
                {editingId === admin.id ? (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as AdminRole)}
                    className="input py-1 px-2 text-sm w-32"
                    disabled={admin.id === currentAdminId}
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`badge ${getRoleBadgeClass(admin.role)}`}>
                    {admin.role.replace('_', ' ')}
                  </span>
                )}
              </td>
              <td className="text-gray-600 text-sm">{formatDate(admin.created_at)}</td>
              <td>
                {admin.id === currentAdminId ? (
                  <span className="text-sm text-gray-400">Cannot modify yourself</span>
                ) : editingId === admin.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveRole(admin.id)}
                      disabled={loading}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={loading}
                      className="text-sm text-gray-600 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEditRole(admin)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(admin.id, admin.email)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
