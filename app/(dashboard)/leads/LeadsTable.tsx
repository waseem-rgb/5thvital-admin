'use client'

import { useState } from 'react'
import { Lead } from '@/lib/types'
import { updateLeadAction } from '@/lib/actions/leads'
import { useRouter } from 'next/navigation'

interface LeadsTableProps {
  leads: Lead[]
  canEdit: boolean
}

const statusOptions = ['new', 'contacted', 'qualified', 'converted', 'closed'] as const

export default function LeadsTable({ leads, canEdit }: LeadsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Lead>>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleEdit = (lead: Lead) => {
    setEditingId(lead.id)
    setEditData({
      status: lead.status,
      notes: lead.notes || '',
      follow_up_at: lead.follow_up_at || '',
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditData({})
  }

  const handleSave = async (id: string) => {
    setLoading(true)
    try {
      const result = await updateLeadAction({
        id,
        status: editData.status as Lead['status'],
        notes: editData.notes,
        follow_up_at: editData.follow_up_at || null,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update lead')
      }

      setEditingId(null)
      setEditData({})
      router.refresh()
    } catch (error) {
      console.error('Error updating lead:', error)
      alert('Failed to update lead')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadgeClass = (status: Lead['status']) => {
    const classes: Record<Lead['status'], string> = {
      new: 'badge-new',
      contacted: 'badge-contacted',
      qualified: 'badge-qualified',
      converted: 'badge-converted',
      closed: 'badge-closed',
    }
    return `badge ${classes[status]}`
  }

  if (leads.length === 0) {
    return (
      <div className="p-8 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No leads yet</h3>
        <p className="text-gray-600">Leads from your website will appear here.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
            <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
            <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
            <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
            <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
            {canEdit && (
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50">
              {editingId === lead.id ? (
                <>
                  <td className="py-3">
                    <span className="font-medium text-gray-900">{lead.name}</span>
                  </td>
                  <td className="text-gray-600">{lead.email}</td>
                  <td className="text-gray-600">{lead.phone || '-'}</td>
                  <td>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value as Lead['status'] })}
                      className="input py-1 px-2 text-sm"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-gray-600 text-sm">{formatDate(lead.created_at)}</td>
                  <td>
                    <input
                      type="text"
                      value={editData.notes || ''}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      placeholder="Add notes..."
                      className="input py-1 px-2 text-sm w-full max-w-[200px]"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSave(lead.id)}
                        disabled={loading}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="text-sm text-gray-600 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="py-3">
                    <span className="font-medium text-gray-900">{lead.name}</span>
                    {lead.message && (
                      <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate" title={lead.message}>
                        {lead.message}
                      </p>
                    )}
                  </td>
                  <td className="text-gray-600">{lead.email}</td>
                  <td className="text-gray-600">{lead.phone || '-'}</td>
                  <td>
                    <span className={getStatusBadgeClass(lead.status)}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </span>
                  </td>
                  <td className="text-gray-600 text-sm">{formatDate(lead.created_at)}</td>
                  <td className="text-gray-600 text-sm max-w-[200px] truncate" title={lead.notes || ''}>
                    {lead.notes || '-'}
                  </td>
                  {canEdit && (
                    <td>
                      <button
                        onClick={() => handleEdit(lead)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
