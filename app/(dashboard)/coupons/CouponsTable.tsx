'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Coupon, CouponType, toggleCouponStatusAction, deleteCouponAction } from '@/lib/actions/coupons'
import CouponModal from './CouponModal'

interface CouponsTableProps {
  coupons: Coupon[]
  canEdit: boolean
}

export default function CouponsTable({ coupons, canEdit }: CouponsTableProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingCoupon(null)
    setModalOpen(true)
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingCoupon(null)
  }

  const handleToggleStatus = async (coupon: Coupon) => {
    if (!canEdit) return
    
    setLoadingId(coupon.id)
    try {
      const result = await toggleCouponStatusAction(coupon.id, !coupon.active)
      if (!result.success) {
        alert(result.error || 'Failed to update status')
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('Failed to update status')
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!canEdit) return
    
    setLoadingId(id)
    try {
      const result = await deleteCouponAction(id)
      if (!result.success) {
        alert(result.error || 'Failed to delete coupon')
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting coupon:', error)
      alert('Failed to delete coupon')
    } finally {
      setLoadingId(null)
      setDeleteConfirm(null)
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatValue = (type: CouponType, value: number) => {
    return type === 'percent' ? `${value}%` : `₹${value}`
  }

  const isExpired = (coupon: Coupon) => {
    if (!coupon.ends_at) return false
    return new Date(coupon.ends_at) < new Date()
  }

  const isNotStarted = (coupon: Coupon) => {
    if (!coupon.starts_at) return false
    return new Date(coupon.starts_at) > new Date()
  }

  const getStatusBadge = (coupon: Coupon) => {
    if (!coupon.active) {
      return { label: 'Inactive', className: 'bg-gray-100 text-gray-800' }
    }
    if (isExpired(coupon)) {
      return { label: 'Expired', className: 'bg-red-100 text-red-800' }
    }
    if (isNotStarted(coupon)) {
      return { label: 'Scheduled', className: 'bg-yellow-100 text-yellow-800' }
    }
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return { label: 'Limit Reached', className: 'bg-orange-100 text-orange-800' }
    }
    return { label: 'Active', className: 'bg-green-100 text-green-800' }
  }

  return (
    <>
      {/* Header with Add Button */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {coupons.length} coupon{coupons.length !== 1 ? 's' : ''}
        </div>
        {canEdit && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Coupon
          </button>
        )}
      </div>

      {/* Table */}
      {coupons.length === 0 ? (
        <div className="p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No coupons yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first discount coupon.
          </p>
          {canEdit && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Coupon
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Validity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Usage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Min. Order</th>
                {canEdit && (
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {coupons.map((coupon) => {
                const statusBadge = getStatusBadge(coupon)
                const isLoading = loadingId === coupon.id
                
                return (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-gray-900">{coupon.code}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(coupon.code)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy code"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatValue(coupon.type, coupon.value)}
                      </div>
                      {coupon.type === 'percent' && coupon.max_discount && (
                        <p className="text-xs text-gray-500">Max: ₹{coupon.max_discount}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {coupon.starts_at || coupon.ends_at ? (
                        <div>
                          <div>{formatDate(coupon.starts_at)} - {formatDate(coupon.ends_at)}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No limit</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {coupon.max_uses ? (
                        <span>
                          {coupon.used_count} / {coupon.max_uses}
                        </span>
                      ) : (
                        <span>{coupon.used_count} used</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {coupon.min_order_amount ? `₹${coupon.min_order_amount}` : '—'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Active */}
                          <button
                            onClick={() => handleToggleStatus(coupon)}
                            disabled={isLoading}
                            className={`text-xs px-2 py-1 rounded ${
                              coupon.active
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            } disabled:opacity-50`}
                            title={coupon.active ? 'Deactivate' : 'Activate'}
                          >
                            {coupon.active ? 'Disable' : 'Enable'}
                          </button>
                          
                          {/* Edit */}
                          <button
                            onClick={() => handleEdit(coupon)}
                            disabled={isLoading}
                            className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          
                          {/* Delete */}
                          {deleteConfirm === coupon.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(coupon.id)}
                                disabled={isLoading}
                                className="text-xs text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded disabled:opacity-50"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={isLoading}
                                className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(coupon.id)}
                              disabled={isLoading}
                              className="text-xs text-red-600 hover:text-red-700 px-2 py-1 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <CouponModal
          coupon={editingCoupon}
          onClose={handleModalClose}
          onSuccess={() => {
            handleModalClose()
            router.refresh()
          }}
        />
      )}
    </>
  )
}
