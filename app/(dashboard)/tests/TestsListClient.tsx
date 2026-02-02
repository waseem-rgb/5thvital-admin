'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getTests, MedicalTest } from '@/lib/actions/tests'

interface TestsListClientProps {
  canEdit: boolean
}

export default function TestsListClient({ canEdit }: TestsListClientProps) {
  const [tests, setTests] = useState<MedicalTest[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 50

  const fetchTests = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    const result = await getTests(page, pageSize, searchQuery)
    
    if (result.error) {
      setError(result.error)
    } else {
      setTests(result.data)
      setTotal(result.total)
    }
    
    setLoading(false)
  }, [page, searchQuery])

  useEffect(() => {
    fetchTests()
  }, [fetchTests])

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setPage(1) // Reset to first page when searching
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Medical Tests Catalog</h2>
          <p className="text-sm text-gray-600">
            Browse and search available medical tests
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search tests</label>
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
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by test name, code, or category..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
        
        {!loading && (
          <div className="mt-2 text-sm text-gray-600">
            Showing {tests.length} of {total} tests
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-medium text-yellow-800">Medical Tests Table Not Found</h3>
              <p className="text-sm text-yellow-700 mt-1">
                The medical tests table does not exist in your database yet. You need to create a table named 
                <code className="mx-1 px-1.5 py-0.5 bg-yellow-100 rounded">medical_tests</code> 
                with the following columns:
              </p>
              <pre className="mt-2 p-3 bg-yellow-100 rounded text-xs overflow-x-auto text-yellow-900">
{`CREATE TABLE public.medical_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_name TEXT NOT NULL,
  test_code TEXT,
  category TEXT,
  sample_type TEXT,
  description TEXT,
  normal_range TEXT,
  unit TEXT,
  price INTEGER,
  turnaround_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card p-8 text-center">
          <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading tests...</p>
        </div>
      )}

      {/* Tests Table */}
      {!loading && !error && tests.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Test Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sample</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                  {canEdit && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tests/${test.id}`}
                        className="font-medium text-gray-900 hover:text-primary-600"
                      >
                        {test.test_name}
                      </Link>
                      {test.description && (
                        <p className="text-xs text-gray-500 mt-1 max-w-[300px] truncate">
                          {test.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {test.test_code || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {test.category || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {test.sample_type || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {test.price ? `₹${test.price}` : '-'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <Link
                          href={`/tests/${test.id}`}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View/Edit
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && tests.length === 0 && (
        <div className="card p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {searchQuery ? 'No matching tests' : 'No tests found'}
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? 'Try adjusting your search query.'
              : 'Your medical tests catalog is empty.'}
          </p>
        </div>
      )}
    </div>
  )
}
