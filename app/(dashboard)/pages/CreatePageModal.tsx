'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPage } from '@/lib/actions/pages'

interface CreatePageModalProps {
  onClose: () => void
}

export default function CreatePageModal({ onClose }: CreatePageModalProps) {
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const slugInputRef = useRef<HTMLInputElement>(null)

  // Focus slug input on mount
  useEffect(() => {
    slugInputRef.current?.focus()
  }, [])

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value)
    // Only auto-generate slug if user hasn't manually edited it
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value))
    }
  }

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleSlugChange = (value: string) => {
    // Allow only lowercase letters, numbers, and hyphens while typing
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(sanitized)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await createPage(slug, title)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.data) {
        // Navigate to the new page editor
        router.push(`/pages/${result.data.slug}`)
      }
    } catch (err) {
      console.error('Error creating page:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [loading, onClose])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => !loading && onClose()}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Create New Page</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Page Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  disabled={loading}
                  placeholder="e.g., Privacy Policy"
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 text-sm mr-1">/</span>
                  <input
                    id="slug"
                    ref={slugInputRef}
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    disabled={loading}
                    placeholder="privacy-policy"
                    className="input"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !slug || !title}
                className="btn btn-primary"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Page'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
