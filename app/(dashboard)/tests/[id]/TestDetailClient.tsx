'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MedicalTest, updateTest } from '@/lib/actions/tests'

interface TestDetailClientProps {
  test: MedicalTest
  canEdit: boolean
}

export default function TestDetailClient({ test, canEdit }: TestDetailClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Edit form state
  const [testName, setTestName] = useState(test.test_name)
  const [testCode, setTestCode] = useState(test.test_code || '')
  const [category, setCategory] = useState(test.category || '')
  const [sampleType, setSampleType] = useState(test.sample_type || '')
  const [description, setDescription] = useState(test.description || '')
  const [normalRange, setNormalRange] = useState(test.normal_range || '')
  const [unit, setUnit] = useState(test.unit || '')
  const [price, setPrice] = useState(test.price?.toString() || '')
  const [turnaroundTime, setTurnaroundTime] = useState(test.turnaround_time || '')

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await updateTest(test.id, {
        test_name: testName,
        test_code: testCode || undefined,
        category: category || undefined,
        sample_type: sampleType || undefined,
        description: description || undefined,
        normal_range: normalRange || undefined,
        unit: unit || undefined,
        price: price ? parseInt(price) : undefined,
        turnaround_time: turnaroundTime || undefined,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update test')
      }

      setSuccessMessage('Test updated successfully!')
      setIsEditing(false)
      router.refresh()
      
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update test')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset to original values
    setTestName(test.test_name)
    setTestCode(test.test_code || '')
    setCategory(test.category || '')
    setSampleType(test.sample_type || '')
    setDescription(test.description || '')
    setNormalRange(test.normal_range || '')
    setUnit(test.unit || '')
    setPrice(test.price?.toString() || '')
    setTurnaroundTime(test.turnaround_time || '')
    setIsEditing(false)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/tests"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tests
        </Link>
        
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Edit Test
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

      {/* Test Details */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Test Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Test Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-lg text-gray-900">{test.test_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Test Code</label>
              {isEditing ? (
                <input
                  type="text"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-gray-900">{test.test_code || <span className="text-gray-400">Not set</span>}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
              {isEditing ? (
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-gray-900">{test.category || <span className="text-gray-400">Not set</span>}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Sample Type</label>
              {isEditing ? (
                <input
                  type="text"
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  placeholder="e.g., Blood, Urine, Serum"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-gray-900">{test.sample_type || <span className="text-gray-400">Not set</span>}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
              {isEditing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {test.description || <span className="text-gray-400">No description</span>}
                </p>
              )}
            </div>
          </div>

          {/* Technical Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Technical Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Normal Range</label>
              {isEditing ? (
                <input
                  type="text"
                  value={normalRange}
                  onChange={(e) => setNormalRange(e.target.value)}
                  placeholder="e.g., 70-100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-gray-900">{test.normal_range || <span className="text-gray-400">Not set</span>}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Unit</label>
              {isEditing ? (
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g., mg/dL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-gray-900">{test.unit || <span className="text-gray-400">Not set</span>}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Price (₹)</label>
              {isEditing ? (
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-gray-900">{test.price ? `₹${test.price}` : <span className="text-gray-400">Not set</span>}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Turnaround Time</label>
              {isEditing ? (
                <input
                  type="text"
                  value={turnaroundTime}
                  onChange={(e) => setTurnaroundTime(e.target.value)}
                  placeholder="e.g., 24-48 hours"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-gray-900">{test.turnaround_time || <span className="text-gray-400">Not set</span>}</p>
              )}
            </div>

            {test.created_at && (
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1 text-gray-900">
                  {new Date(test.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}

            {test.updated_at && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-gray-900">
                  {new Date(test.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
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
