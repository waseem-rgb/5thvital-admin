'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Page, ContentJsonV2 } from '@/lib/types'
import { deletePage } from '@/lib/actions/pages'
import CreatePageModal from './CreatePageModal'

interface PagesListClientProps {
  pages: Page[]
  canEdit: boolean
}

export default function PagesListClient({ pages, canEdit }: PagesListClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (page: Page) => {
    if (!confirm(`Are you sure you want to delete the page "${page.title}"? This cannot be undone.`)) {
      return
    }

    setDeletingId(page.id)
    try {
      const result = await deletePage(page.id)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error('Error deleting page:', err)
      alert('Failed to delete page')
    } finally {
      setDeletingId(null)
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

  const getSectionCount = (page: Page): number => {
    const content = page.content_json as ContentJsonV2
    if (content?.version === 2 && Array.isArray(content.sections)) {
      return content.sections.length
    }
    return 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">All Pages</h2>
          <p className="text-sm text-gray-600">
            Manage your pages with the Section Builder
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Page
          </button>
        )}
      </div>

      {/* Pages Table */}
      {pages.length === 0 ? (
        <div className="card p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No pages yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first page.</p>
          {canEdit && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Page
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sections
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-primary-100 rounded-lg">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <Link
                          href={`/pages/${page.slug}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600"
                        >
                          {page.title}
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-mono bg-gray-100 text-gray-700">
                      /{page.slug}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getSectionCount(page)} section{getSectionCount(page) !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(page.updated_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/pages/${page.slug}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        {canEdit ? 'Edit' : 'View'}
                      </Link>
                      {canEdit && (
                        <button
                          onClick={() => handleDelete(page)}
                          disabled={deletingId === page.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {deletingId === page.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats */}
      {pages.length > 0 && (
        <div className="text-sm text-gray-500">
          Total: {pages.length} page{pages.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Create Page Modal */}
      {showCreateModal && (
        <CreatePageModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
