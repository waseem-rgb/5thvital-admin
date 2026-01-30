'use client'

import { useState } from 'react'
import { AdminRole, ADMIN_ALLOWED_ROLES } from '@/lib/types'
import { createClient } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'

// All role options available in the system (matching Supabase enum app_role)
const roleOptions: AdminRole[] = ['super_admin', 'admin', 'moderator', 'editor', 'viewer', 'user']

export default function AddAdminModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AdminRole>('editor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      setError('Invalid UUID format. Please enter a valid Supabase Auth user ID.')
      setLoading(false)
      return
    }

    try {
      // Check if admin already exists
      const { data: existing } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (existing) {
        setError('This user is already an admin')
        setLoading(false)
        return
      }

      // Insert new admin
      const { error: insertError } = await supabase.from('admins').insert({
        user_id: userId,
        email,
        role,
      })

      if (insertError) throw insertError

      // Reset and close
      setUserId('')
      setEmail('')
      setRole('editor')
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      console.error('Error adding admin:', err)
      setError('Failed to add admin. Make sure the user exists in Supabase Auth.')
    } finally {
      setLoading(false)
    }
  }

  const isAllowedRole = (r: AdminRole) => ADMIN_ALLOWED_ROLES.includes(r)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-primary"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Admin
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Admin</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID (UUID from Supabase Auth)
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="input font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find this in Supabase Dashboard → Authentication → Users
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="input"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r.replace('_', ' ')} {isAllowedRole(r) ? '(has dashboard access)' : '(no dashboard access)'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Only super_admin, admin, moderator, and editor roles have dashboard access
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Adding...' : 'Add Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
