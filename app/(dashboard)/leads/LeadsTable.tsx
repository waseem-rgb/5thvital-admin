'use client'

import { useState, useMemo } from 'react'
import { Lead } from '@/lib/types'
import { updateLeadAction } from '@/lib/actions/leads'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Lead['status'] | 'all'>('all')

  // Filter leads based on search and status
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Status filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) {
        return false
      }

      // Search filter (name or phone)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const nameMatch = lead.name?.toLowerCase().includes(query)
        const phoneMatch = lead.phone?.toLowerCase().includes(query)
        const emailMatch = lead.email?.toLowerCase().includes(query)
        const cityMatch = lead.source?.toLowerCase().includes(query) // source often contains city info
        
        if (!nameMatch && !phoneMatch && !emailMatch && !cityMatch) {
          return false
        }
      }

      return true
    })
  }, [leads, searchQuery, statusFilter])

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
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-purple-100 text-purple-800',
      converted: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    }
    return `px-2 py-1 text-xs font-medium rounded-full ${classes[status]}`
  }

  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search leads</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone, or email..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <label htmlFor="status-filter" className="sr-only">Filter by status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Lead['status'] | 'all')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-2 text-sm text-gray-600">
          Showing {filteredLeads.length} of {leads.length} leads
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
              className="ml-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredLeads.length === 0 ? (
        <div className="p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {leads.length === 0 ? 'No leads yet' : 'No matching leads'}
          </h3>
          <p className="text-gray-600">
            {leads.length === 0 
              ? 'Leads from your website will appear here.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                {canEdit && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  {editingId === lead.id ? (
                    <>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-gray-900">{lead.name}</span>
                          {lead.message && (
                            <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate" title={lead.message}>
                              {lead.message}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="text-gray-900">{lead.email}</div>
                          <div className="text-gray-500">{lead.phone || '-'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.source || '-'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={editData.status}
                          onChange={(e) => setEditData({ ...editData, status: e.target.value as Lead['status'] })}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{formatDate(lead.created_at)}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editData.notes || ''}
                          onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                          placeholder="Add notes..."
                          className="px-2 py-1 text-sm w-full max-w-[200px] border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSave(lead.id)}
                            disabled={loading}
                            className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="text-sm text-gray-600 hover:text-gray-700 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <div>
                          <Link 
                            href={`/leads/${lead.id}`}
                            className="font-medium text-gray-900 hover:text-primary-600"
                          >
                            {lead.name}
                          </Link>
                          {lead.message && (
                            <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate" title={lead.message}>
                              {lead.message}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="text-gray-900">{lead.email}</div>
                          <div className="text-gray-500">{lead.phone || '-'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.source || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={getStatusBadgeClass(lead.status)}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{formatDate(lead.created_at)}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm max-w-[200px] truncate" title={lead.notes || ''}>
                        {lead.notes || '-'}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/leads/${lead.id}`}
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleEdit(lead)}
                              className="text-sm text-gray-600 hover:text-gray-700"
                            >
                              Quick Edit
                            </button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
