'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PackageDetail, PackageStatus, PackageParameter, PackageFaq } from '@/lib/types'
import {
  createPackageAction,
  updatePackageAction,
  deletePackage
} from '@/lib/actions/packages'
import { generateSlug } from '@/lib/utils'
import ParametersEditor from './components/ParametersEditor'

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
  
  // Parameters - now using structured editor
  const [parameters, setParameters] = useState<PackageParameter[]>(pkg?.parameters || [])
  
  // FAQs - still using JSON but with better UX
  const [faqs, setFaqs] = useState<PackageFaq[]>(pkg?.faqs || [])
  const [newFaqQuestion, setNewFaqQuestion] = useState('')
  const [newFaqAnswer, setNewFaqAnswer] = useState('')

  const handleGenerateSlug = () => {
    if (title) {
      setSlug(generateSlug(title))
    }
  }

  // Calculate tests_included from parameters
  const calculateTestsIncluded = () => {
    const total = parameters.reduce((sum, param) => sum + param.count, 0)
    setTestsIncluded(total.toString())
  }

  // FAQ management
  const addFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return
    
    setFaqs([...faqs, { question: newFaqQuestion.trim(), answer: newFaqAnswer.trim() }])
    setNewFaqQuestion('')
    setNewFaqAnswer('')
  }

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index))
  }

  const moveFaq = (index: number, direction: 'up' | 'down') => {
    const newFaqs = [...faqs]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newFaqs.length) return
    
    [newFaqs[index], newFaqs[targetIndex]] = [newFaqs[targetIndex], newFaqs[index]]
    setFaqs(newFaqs)
  }

  const handleSubmit = async (publishOnSave: boolean = false) => {
    setError(null)
    setSuccessMessage(null)

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
    formData.set('parameters', JSON.stringify(parameters))
    formData.set('faqs', JSON.stringify(faqs))

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
        router.push(`/packages/${result.data!.id}`)
      } else {
        setSuccessMessage('Package saved successfully!')
        if (publishOnSave) {
          setStatus('published')
        }
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

  const previewUrl = pkg?.slug ? `https://5thvital.com/packages/${pkg.slug}` : null

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

      {/* Preview Link (edit mode only) */}
      {mode === 'edit' && previewUrl && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Preview on 5thVital.com</p>
              <p className="text-xs text-blue-600 mt-1">{previewUrl}</p>
            </div>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Preview
            </a>
          </div>
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
              onChange={(e) => setTitle(e.target.value)}
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
            <div className="flex gap-2">
              <input
                type="number"
                value={testsIncluded}
                onChange={(e) => setTestsIncluded(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., 80"
              />
              <button
                type="button"
                onClick={calculateTestsIncluded}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                title="Calculate from parameters"
              >
                Auto-calc
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Click Auto-calc to count tests from parameters
            </p>
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

      {/* Parameters Section - NEW VISUAL EDITOR */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Test Parameters</h3>
            <p className="text-sm text-gray-500 mt-1">
              Organize tests into categories. Search from the medical tests catalog or add manually.
            </p>
          </div>
        </div>
        <ParametersEditor 
          parameters={parameters} 
          onChange={setParameters} 
        />
      </div>

      {/* FAQs Section - Improved UX */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">FAQs</h3>
        
        {/* Existing FAQs */}
        {faqs.length > 0 && (
          <div className="space-y-3 mb-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{faq.question}</p>
                    <p className="text-gray-600 text-sm mt-1">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveFaq(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFaq(index, 'down')}
                      disabled={index === faqs.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New FAQ */}
        <div className="border border-dashed border-gray-300 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Add New FAQ</p>
          <div className="space-y-3">
            <input
              type="text"
              value={newFaqQuestion}
              onChange={(e) => setNewFaqQuestion(e.target.value)}
              placeholder="Question"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <textarea
              value={newFaqAnswer}
              onChange={(e) => setNewFaqAnswer(e.target.value)}
              placeholder="Answer"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="button"
              onClick={addFaq}
              disabled={!newFaqQuestion.trim() || !newFaqAnswer.trim()}
              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add FAQ
            </button>
          </div>
        </div>

        {/* JSON Preview */}
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            View JSON data
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs overflow-x-auto">
            {JSON.stringify(faqs, null, 2)}
          </pre>
        </details>
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
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
          {status !== 'published' && (
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Publishing...' : 'Save & Publish'}
            </button>
          )}
          {status === 'published' && (
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isPending}
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
