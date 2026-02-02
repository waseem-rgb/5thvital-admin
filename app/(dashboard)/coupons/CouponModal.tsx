'use client'

import { useState } from 'react'
import { Coupon, CouponType, CouponInput, createCouponAction, updateCouponAction } from '@/lib/actions/coupons'

interface CouponModalProps {
  coupon: Coupon | null
  onClose: () => void
  onSuccess: () => void
}

export default function CouponModal({ coupon, onClose, onSuccess }: CouponModalProps) {
  const isEditing = !!coupon

  const [formData, setFormData] = useState<CouponInput>({
    code: coupon?.code || '',
    type: coupon?.type || 'percent',
    value: coupon?.value || 10,
    active: coupon?.active ?? true,
    starts_at: coupon?.starts_at || null,
    ends_at: coupon?.ends_at || null,
    min_order_amount: coupon?.min_order_amount || null,
    max_discount: coupon?.max_discount || null,
    max_uses: coupon?.max_uses || null,
    description: coupon?.description || '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: keyof CouponInput, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let result

      if (isEditing) {
        result = await updateCouponAction(coupon.id, formData)
      } else {
        result = await createCouponAction(formData)
      }

      if (!result.success) {
        setError(result.error || 'Failed to save coupon')
        return
      }

      onSuccess()
    } catch (err) {
      console.error('Error saving coupon:', err)
      setError('Failed to save coupon')
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Coupon' : 'Create Coupon'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Coupon Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
                className="input font-mono uppercase"
                required
                minLength={2}
              />
              <p className="text-xs text-gray-500 mt-1">
                Code will be automatically converted to uppercase
              </p>
            </div>

            {/* Type and Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value as CouponType)}
                  className="input"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.type === 'percent' ? 'Discount %' : 'Discount Amount'} *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)}
                    className="input pr-8"
                    required
                    min={1}
                    max={formData.type === 'percent' ? 100 : undefined}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {formData.type === 'percent' ? '%' : '₹'}
                  </span>
                </div>
              </div>
            </div>

            {/* Max Discount (for percent type) */}
            {formData.type === 'percent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Discount (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={formData.max_discount || ''}
                    onChange={(e) => handleChange('max_discount', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="No limit"
                    className="input pl-8"
                    min={0}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Cap the maximum discount amount
                </p>
              </div>
            )}

            {/* Min Order Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Amount (optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={formData.min_order_amount || ''}
                  onChange={(e) => handleChange('min_order_amount', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="No minimum"
                  className="input pl-8"
                  min={0}
                />
              </div>
            </div>

            {/* Validity Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date (optional)
                </label>
                <input
                  type="date"
                  value={formatDateForInput(formData.starts_at)}
                  onChange={(e) => handleChange('starts_at', e.target.value || null)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  value={formatDateForInput(formData.ends_at)}
                  onChange={(e) => handleChange('ends_at', e.target.value || null)}
                  className="input"
                />
              </div>
            </div>

            {/* Max Uses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Uses (optional)
              </label>
              <input
                type="number"
                value={formData.max_uses || ''}
                onChange={(e) => handleChange('max_uses', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Unlimited"
                className="input"
                min={1}
              />
              <p className="text-xs text-gray-500 mt-1">
                Total number of times this coupon can be used
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="e.g. Summer sale 20% off"
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Internal note for admin reference
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Active (can be used immediately)
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary disabled:opacity-50"
              >
                {loading ? 'Saving...' : isEditing ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
