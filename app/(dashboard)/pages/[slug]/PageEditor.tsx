'use client'

import { useState, useEffect } from 'react'
import { Page, ContentJsonV2, emptyContentJsonV2 } from '@/lib/types'
import { updatePage } from '@/lib/actions/pages'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SectionBuilder } from '@/components/sections'

interface PageEditorProps {
  page: Page
  canEdit: boolean
}

// Convert legacy content to v2 format
function ensureContentV2(content: Page['content_json']): ContentJsonV2 {
  if (content && typeof content === 'object' && 'version' in content && content.version === 2) {
    return content as ContentJsonV2
  }
  // Return empty v2 content for legacy or invalid content
  return emptyContentJsonV2
}

export default function PageEditor({ page, canEdit }: PageEditorProps) {
  const [title, setTitle] = useState(page.title)
  const [content, setContent] = useState<ContentJsonV2>(() => ensureContentV2(page.content_json))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  const router = useRouter()

  // Track changes
  useEffect(() => {
    const titleChanged = title !== page.title
    const contentChanged = JSON.stringify(content) !== JSON.stringify(ensureContentV2(page.content_json))
    setHasChanges(titleChanged || contentChanged)
  }, [title, content, page.title, page.content_json])

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  const handleSave = async () => {
    if (!canEdit) return
    
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updatePage(page.id, title, content)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(true)
      setHasChanges(false)
      router.refresh()
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving page:', err)
      setError('Failed to save page')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/pages"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Pages
        </Link>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Unsaved changes
            </span>
          )}
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={loading || !hasChanges}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Page saved successfully!
        </div>
      )}

      {/* Page Info Card */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug
            </label>
            <div className="flex items-center">
              <span className="text-gray-500 text-sm mr-1">/</span>
              <input
                type="text"
                value={page.slug}
                disabled
                className="input bg-gray-50 font-mono"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Slug cannot be changed after creation</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              className="input"
              placeholder="Enter page title"
            />
          </div>
        </div>
      </div>

      {/* Section Builder */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Content</h3>
        <p className="text-sm text-gray-600 mb-6">
          Build your page by adding and arranging sections. Use the preview to see how it will look.
        </p>
        
        <SectionBuilder
          content={content}
          onChange={setContent}
          disabled={!canEdit}
        />
      </div>

      {/* Last updated info */}
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Last updated: {new Date(page.updated_at).toLocaleString()}
      </div>

      {/* Read-only notice for viewers */}
      {!canEdit && (
        <div className="bg-amber-50 text-amber-700 p-4 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          You have read-only access. Contact an administrator if you need to edit this page.
        </div>
      )}
    </div>
  )
}
