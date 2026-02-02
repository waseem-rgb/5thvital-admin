'use client'

import { useState } from 'react'
import { Lead } from '@/lib/types'
import { updateLeadAction } from '@/lib/actions/leads'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface LeadDetailClientProps {
  lead: Lead
  canEdit: boolean
}

const statusOptions = ['new', 'contacted', 'qualified', 'converted', 'closed'] as const

export default function LeadDetailClient({ lead, canEdit }: LeadDetailClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Edit form state
  const [status, setStatus] = useState<Lead['status']>(lead.status)
  const [notes, setNotes] = useState(lead.notes || '')
  const [followUpAt, setFollowUpAt] = useState(lead.follow_up_at || '')

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await updateLeadAction({
        id: lead.id,
        status,
        notes,
        follow_up_at: followUpAt || null,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update lead')
      }

      setSuccessMessage('Lead updated successfully!')
      setIsEditing(false)
      router.refresh()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lead')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setStatus(lead.status)
    setNotes(lead.notes || '')
    setFollowUpAt(lead.follow_up_at || '')
    setIsEditing(false)
    setError(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadgeClass = (s: Lead['status']) => {
    const classes: Record<Lead['status'], string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-purple-100 text-purple-800',
      converted: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    }
    return `px-3 py-1 text-sm font-medium rounded-full ${classes[s]}`
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Leads
        </Link>
        
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Edit Lead
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}

      {/* Lead Details Card */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Name</label>
              <p className="mt-1 text-lg text-gray-900">{lead.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-gray-900">
                <a href={`mailto:${lead.email}`} className="text-primary-600 hover:text-primary-700">
                  {lead.email}
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Phone</label>
              <p className="mt-1 text-gray-900">
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} className="text-primary-600 hover:text-primary-700">
                    {lead.phone}
                  </a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Source</label>
              <p className="mt-1 text-gray-900">{lead.source || <span className="text-gray-400">Unknown</span>}</p>
            </div>

            {lead.message && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Message</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                  {lead.message}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Status & Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Lead Management</h3>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              {isEditing ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Lead['status'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={getStatusBadgeClass(lead.status)}>
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
              {isEditing ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this lead..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg min-h-[100px]">
                  {lead.notes || <span className="text-gray-400">No notes yet</span>}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Follow-up Date</label>
              {isEditing ? (
                <input
                  type="datetime-local"
                  value={followUpAt ? followUpAt.slice(0, 16) : ''}
                  onChange={(e) => setFollowUpAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-gray-900">
                  {lead.follow_up_at ? formatDate(lead.follow_up_at) : <span className="text-gray-400">Not scheduled</span>}
                </p>
              )}
            </div>

            <div className="pt-4 border-t">
              <label className="block text-sm font-medium text-gray-500">Created</label>
              <p className="mt-1 text-gray-900">{formatDate(lead.created_at)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Last Updated</label>
              <p className="mt-1 text-gray-900">{formatDate(lead.updated_at)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
