'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Order, OrderStatus, updateOrderAction } from '@/lib/actions/orders'

interface OrdersTableProps {
  orders: Order[]
  total: number
  canEdit: boolean
  currentPage: number
  currentStatus?: OrderStatus
  currentSearch?: string
}

const statusOptions: OrderStatus[] = ['new', 'confirmed', 'scheduled', 'collected', 'reported', 'completed', 'cancelled']

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'Confirmed', className: 'bg-indigo-100 text-indigo-800' },
  scheduled: { label: 'Scheduled', className: 'bg-purple-100 text-purple-800' },
  collected: { label: 'Collected', className: 'bg-yellow-100 text-yellow-800' },
  reported: { label: 'Reported', className: 'bg-orange-100 text-orange-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
}

export default function OrdersTable({
  orders,
  total,
  canEdit,
  currentPage,
  currentStatus,
  currentSearch,
}: OrdersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(currentSearch || '')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>(currentStatus || 'all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const pageSize = 50
  const totalPages = Math.ceil(total / pageSize)

  const updateFilters = useCallback((params: { status?: string; search?: string; page?: number }) => {
    const newParams = new URLSearchParams(searchParams.toString())
    
    if (params.status !== undefined) {
      if (params.status === 'all') {
        newParams.delete('status')
      } else {
        newParams.set('status', params.status)
      }
    }
    
    if (params.search !== undefined) {
      if (params.search === '') {
        newParams.delete('search')
      } else {
        newParams.set('search', params.search)
      }
    }
    
    if (params.page !== undefined) {
      if (params.page === 1) {
        newParams.delete('page')
      } else {
        newParams.set('page', params.page.toString())
      }
    }
    
    router.push(`/orders?${newParams.toString()}`)
  }, [router, searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: searchQuery, page: 1 })
  }

  const handleStatusFilter = (status: OrderStatus | 'all') => {
    setStatusFilter(status)
    updateFilters({ status, page: 1 })
  }

  const handleQuickStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!canEdit) return
    
    setUpdatingId(orderId)
    try {
      const result = await updateOrderAction({ id: orderId, status: newStatus })
      if (!result.success) {
        alert(result.error || 'Failed to update status')
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '—'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getDisplayId = (id: string) => {
    // Show last 8 characters of UUID for readability
    return id.slice(-8).toUpperCase()
  }

  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <form onSubmit={handleSearch} className="flex-1">
            <label htmlFor="search" className="sr-only">Search orders</label>
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
                placeholder="Search by name, phone, or booking ID..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </form>

          {/* Status Filter */}
          <div className="sm:w-48">
            <label htmlFor="status-filter" className="sr-only">Filter by status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value as OrderStatus | 'all')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusConfig[status].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count & clear filters */}
        <div className="mt-2 text-sm text-gray-600 flex items-center justify-between">
          <span>
            Showing {orders.length} of {total} orders
          </span>
          {(currentSearch || currentStatus) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                router.push('/orders')
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {orders.length === 0 ? (
        <div className="p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {total === 0 ? 'No orders yet' : 'No matching orders'}
          </h3>
          <p className="text-gray-600">
            {total === 0
              ? 'Orders from your booking portal will appear here.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date/Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.new
                  const isUpdating = updatingId === order.id
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link 
                          href={`/orders/${order.id}`}
                          className="text-sm font-mono text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          #{getDisplayId(order.id)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.patient_name || '—'}</div>
                        {order.city && (
                          <div className="text-xs text-gray-500">{order.city}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {order.phone || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {order.slot_date ? (
                          <div>
                            <div>{order.slot_date}</div>
                            {order.slot_time && (
                              <div className="text-xs text-gray-500">{order.slot_time}</div>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.total_amount || order.amount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {canEdit ? (
                          <select
                            value={order.status}
                            onChange={(e) => handleQuickStatusChange(order.id, e.target.value as OrderStatus)}
                            disabled={isUpdating}
                            className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${status.className} ${isUpdating ? 'opacity-50' : ''}`}
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>{statusConfig[s].label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.className}`}>
                            {status.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateFilters({ page: currentPage - 1 })}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => updateFilters({ page: currentPage + 1 })}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
