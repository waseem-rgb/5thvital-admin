'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OrderWithItems, OrderStatus, updateOrderAction } from '@/lib/actions/orders'

interface OrderDetailClientProps {
  order: OrderWithItems
  canEdit: boolean
}

const statusOptions: OrderStatus[] = ['new', 'confirmed', 'scheduled', 'collected', 'reported', 'completed', 'cancelled']

const statusConfig: Record<OrderStatus, { label: string; className: string; description: string }> = {
  new: { label: 'New', className: 'bg-blue-100 text-blue-800 border-blue-200', description: 'Order received, awaiting confirmation' },
  confirmed: { label: 'Confirmed', className: 'bg-indigo-100 text-indigo-800 border-indigo-200', description: 'Order confirmed, ready for scheduling' },
  scheduled: { label: 'Scheduled', className: 'bg-purple-100 text-purple-800 border-purple-200', description: 'Collection appointment scheduled' },
  collected: { label: 'Collected', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', description: 'Sample collected, processing' },
  reported: { label: 'Reported', className: 'bg-orange-100 text-orange-800 border-orange-200', description: 'Reports generated, pending delivery' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200', description: 'Order completed, reports delivered' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 border-gray-200', description: 'Order cancelled' },
}

export default function OrderDetailClient({ order, canEdit }: OrderDetailClientProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [adminNotes, setAdminNotes] = useState(order.admin_notes || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const currentStatus = statusConfig[status] || statusConfig.new
  const hasChanges = status !== order.status || adminNotes !== (order.admin_notes || '')

  const handleSave = async () => {
    if (!canEdit || !hasChanges) return
    
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateOrderAction({
        id: order.id,
        status,
        admin_notes: adminNotes,
      })

      if (!result.success) {
        setError(result.error || 'Failed to update order')
        return
      }

      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error updating order:', err)
      setError('Failed to update order')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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
    return id.slice(-8).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">
                Order #{getDisplayId(order.id)}
              </h2>
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${currentStatus.className}`}>
                {currentStatus.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDate(order.created_at)}
            </p>
          </div>
          
          {canEdit && hasChanges && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm">
            Order updated successfully!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Name" value={order.patient_name} />
              <InfoRow label="Phone" value={order.phone} />
              <InfoRow label="Email" value={order.email} />
              <InfoRow label="Age" value={order.age ? `${order.age} years` : undefined} />
              <InfoRow label="Gender" value={order.gender} />
            </div>
          </div>

          {/* Address */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Address</h3>
            <div className="text-sm text-gray-700">
              {order.address ? (
                <div>
                  <p>{order.address}</p>
                  {(order.city || order.pincode) && (
                    <p className="mt-1">
                      {order.city}{order.city && order.pincode && ', '}{order.pincode}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No address provided</p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Order Items ({order.items.length})
            </h3>
            {order.items.length === 0 ? (
              <p className="text-sm text-gray-500">No items in this order</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {order.items.map((item, index) => (
                  <div key={item.id || index} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.item_name}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {item.item_type}
                        {item.quantity && item.quantity > 1 && ` × ${item.quantity}`}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.item_price)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Notes */}
          {order.notes && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Notes</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Status & Payment */}
        <div className="space-y-6">
          {/* Status Update */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
            
            {canEdit ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OrderStatus)}
                    className="input"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{statusConfig[s].label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">{statusConfig[status].description}</p>
                </div>

                {/* Status Progress */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Progress</p>
                  <div className="space-y-2">
                    {statusOptions.filter(s => s !== 'cancelled').map((s, index) => {
                      const statusIndex = statusOptions.indexOf(status)
                      const currentIndex = statusOptions.indexOf(s)
                      const isCompleted = currentIndex < statusIndex || status === s
                      const isCurrent = status === s
                      
                      return (
                        <div key={s} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            isCompleted 
                              ? 'bg-green-500' 
                              : 'bg-gray-300'
                          } ${isCurrent ? 'ring-2 ring-green-200' : ''}`} />
                          <span className={`text-xs ${isCurrent ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                            {statusConfig[s].label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${currentStatus.className}`}>
                  {currentStatus.label}
                </span>
                <p className="text-xs text-gray-500 mt-2">{currentStatus.description}</p>
              </div>
            )}
          </div>

          {/* Booking Details */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
            <div className="space-y-3">
              <InfoRow label="Slot Date" value={order.slot_date} />
              <InfoRow label="Slot Time" value={order.slot_time} />
              <InfoRow label="Payment Mode" value={order.payment_mode} />
              <InfoRow label="Payment Status" value={order.payment_status} />
            </div>
          </div>

          {/* Payment Summary */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-2">
              {order.amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(order.amount)}</span>
                </div>
              )}
              {order.discount_amount && order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Discount
                    {order.coupon_code && (
                      <span className="ml-1 text-xs text-green-600">({order.coupon_code})</span>
                    )}
                  </span>
                  <span className="text-green-600">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatCurrency(order.total_amount || order.amount)}</span>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Notes</h3>
            {canEdit ? (
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                placeholder="Add internal notes about this order..."
                className="input resize-none"
              />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {order.admin_notes || <span className="text-gray-500">No admin notes</span>}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              These notes are only visible to admins
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value || '—'}</p>
    </div>
  )
}
