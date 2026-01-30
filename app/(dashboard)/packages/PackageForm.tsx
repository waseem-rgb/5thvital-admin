'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PackageDetail, PackageStatus } from '@/lib/types'
import { 
  createPackageAction, 
  updatePackageAction, 
  deletePackage,
  generateSlug 
} from '@/lib/actions/packages'

interface PackageFormProps {
  package?: PackageDetail
  mode: 'create' | 'edit'
}

export default function PackageForm({ package: pkg, mode }: PackageFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Form state
  const [title, setTitle] = useState(pkg?.title || '')
  const [slug, setSlug] = useState(pkg?.slug || '')
  const [status, setStatus] = useState<PackageStatus>(pkg?.status || 'draft')
  const [isFeatured, setIsFeatured] = useState(pkg?.is_featured || false)
  const [sortOrder, setSortOrder] = useState(pkg?.sort_order ?? 0)
  
  // Pricing
  const [mrp, setMrp] = useState(pkg?.mrp?.toString() || '')
  const [price, setPrice] = useState(pkg?.price?.toString() || '')
  const [discountPercent, setDiscountPercent] = useState(pkg?.discount_percent?.toString() || '')
  
  // Snapshot
  const [reportsWithinHours, setReportsWithinHours] = useState(pkg?.reports_within_hours?.toString() || '')
  const [testsIncluded, setTestsIncluded] = useState(pkg?.tests_included?.toString() || '')
  const [requisites, setRequisites] = useState(pkg?.requisites || '')
  const [homeCollectionMinutes, setHomeCollectionMinutes] = useState(pkg?.home_collection_minutes?.toString() || '')
  
  // Content
  const [highlights, setHighlights] = useState(pkg?.highlights || '')
  const [description, setDescription] = useState(pkg?.description || '')
  
  // JSON fields
  const [parametersJson, setParametersJson] = useState(
    pkg?.parameters ? JSON.stringify(pkg.parameters, null, 2) : '[]'
  )
  const [faqsJson, setFaqsJson] = useState(
    pkg?.faqs ? JSON.stringify(pkg.faqs, null, 2) : '[]'
  )
  
  // JSON validation errors
  const [parametersError, setParametersError] = useState<string | null>(null)
  const [faqsError, setFaqsError] = useState<string | null>(null)

  // Auto-generate slug from title
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (mode === 'create' && !slug) {
      // Only auto-generate if slug is empty (user hasn't manually set it)
    }
  }

  const handleGenerateSlug = () => {
    if (title) {
      setSlug(generateSlug(title))
    }
  }

  // Validate JSON in real-time
  const validateParametersJson = (json: string) => {
    setParametersJson(json)
    if (!json.trim() || json.trim() === '[]') {
      setParametersError(null)
      return
    }
    try {
      const parsed = JSON.parse(json)
      if (!Array.isArray(parsed)) {
        setParametersError('Must be a valid JSON array')
      } else {
        setParametersError(null)
      }
    } catch {
      setParametersError('Invalid JSON syntax')
    }
  }

  const validateFaqsJson = (json: string) => {
    setFaqsJson(json)
    if (!json.trim() || json.trim() === '[]') {
      setFaqsError(null)
      return
    }
    try {
      const parsed = JSON.parse(json)
      if (!Array.isArray(parsed)) {
        setFaqsError('Must be a valid JSON array')
      } else {
        setFaqsError(null)
      }
    } catch {
      setFaqsError('Invalid JSON syntax')
    }
  }

  const handleSubmit = async (publishOnSave: boolean = false) => {
    setError(null)
    setSuccessMessage(null)

    // Check for JSON errors
    if (parametersError || faqsError) {
      setError('Please fix JSON validation errors before saving')
      return
    }

    const formData = new FormData()
    formData.set('title', title)
    formData.set('slug', slug || generateSlug(title))
    formData.set('status', publishOnSave ? 'published' : status)
    formData.set('is_featured', isFeatured.toString())
    formData.set('sort_order', sortOrder.toString())
    
    if (mrp) formData.set('mrp', mrp)
    if (price) formData.set('price', price)
    if (discountPercent) formData.set('discount_percent', discountPercent)
    if (reportsWithinHours) formData.set('reports_within_hours', reportsWithinHours)
    if (testsIncluded) formData.set('tests_included', testsIncluded)
    if (requisites) formData.set('requisites', requisites)
    if (homeCollectionMinutes) formData.set('home_collection_minutes', homeCollectionMinutes)
    if (highlights) formData.set('highlights', highlights)
    if (description) formData.set('description', description)
    formData.set('parameters', parametersJson || '[]')
    formData.set('faqs', faqsJson || '[]')

    startTransition(async () => {
      let result
      if (mode === 'create') {
        result = await createPackageAction(formData)
      } else {
        result = await updatePackageAction(pkg!.id, formData)
      }

      if (!result.success) {
        setError(result.error || 'An error occurred')
        return
      }

      if (mode === 'create') {
        // Redirect to edit page after creation
        router.push(`/packages/${result.data!.id}`)
      } else {
        setSuccessMessage('Package saved successfully!')
        if (publishOnSave) {
          setStatus('published')
        }
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    })
  }

  const handleDelete = async () => {
    if (!pkg?.id) return
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this package? This action cannot be undone.'
    )
    
    if (!confirmed) return

    setError(null)
    startTransition(async () => {
      const result = await deletePackage(pkg.id)
      if (!result.success) {
        setError(result.error || 'Failed to delete package')
        return
      }
      router.push('/packages')
    })
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
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

      {/* Basic Info Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Complete Blood Count"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., complete-blood-count"
                required
              />
              <button
                type="button"
                onClick={handleGenerateSlug}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Generate
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PackageStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Featured Package</span>
            </label>
            <p className="mt-1 text-xs text-gray-500 ml-6">
              Featured packages are highlighted on the website
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
            <input
              type="number"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
            <input
              type="number"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="0"
              min="0"
              max="100"
            />
          </div>
        </div>
      </div>

      {/* Snapshot Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Snapshot</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reports Within (hours)
            </label>
            <input
              type="number"
              value={reportsWithinHours}
              onChange={(e) => setReportsWithinHours(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., 24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tests Included
            </label>
            <input
              type="number"
              value={testsIncluded}
              onChange={(e) => setTestsIncluded(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., 80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Home Collection (minutes)
            </label>
            <input
              type="number"
              value={homeCollectionMinutes}
              onChange={(e) => setHomeCollectionMinutes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., 60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requisites
            </label>
            <textarea
              value={requisites}
              onChange={(e) => setRequisites(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Fasting required for 8-12 hours"
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Highlights
            </label>
            <textarea
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Key highlights of the package..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Detailed description of the package..."
            />
          </div>
        </div>
      </div>

      {/* Parameters Section (JSON) */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Parameters</h3>
        <p className="text-sm text-gray-500 mb-4">
          JSON array of parameter categories. Format: {`[{"category": "string", "count": number, "items": ["item1", "item2"]}]`}
        </p>
        <textarea
          value={parametersJson}
          onChange={(e) => validateParametersJson(e.target.value)}
          rows={8}
          className={`w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            parametersError ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          placeholder='[{"category": "Lipid Profile", "count": 5, "items": ["Total Cholesterol", "HDL", "LDL", "Triglycerides", "VLDL"]}]'
        />
        {parametersError && (
          <p className="mt-1 text-sm text-red-600">{parametersError}</p>
        )}
      </div>

      {/* FAQs Section (JSON) */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">FAQs</h3>
        <p className="text-sm text-gray-500 mb-4">
          JSON array of FAQ items. Format: {`[{"question": "string", "answer": "string"}]`}
        </p>
        <textarea
          value={faqsJson}
          onChange={(e) => validateFaqsJson(e.target.value)}
          rows={8}
          className={`w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            faqsError ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          placeholder='[{"question": "What is included?", "answer": "This package includes..."}]'
        />
        {faqsError && (
          <p className="mt-1 text-sm text-red-600">{faqsError}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
        <div className="flex items-center gap-3">
          <Link
            href="/packages"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Packages
          </Link>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Delete Package
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isPending || !!parametersError || !!faqsError}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
          {status !== 'published' && (
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isPending || !!parametersError || !!faqsError}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Publishing...' : 'Save & Publish'}
            </button>
          )}
          {status === 'published' && (
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isPending || !!parametersError || !!faqsError}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Updating...' : 'Update'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
