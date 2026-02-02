'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { searchTests, MedicalTest } from '@/lib/actions/tests'

interface TestSearchInputProps {
  onSelect: (test: MedicalTest) => void
  placeholder?: string
  disabled?: boolean
}

export default function TestSearchInput({ 
  onSelect, 
  placeholder = 'Search tests by name or code...',
  disabled = false 
}: TestSearchInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MedicalTest[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: searchError } = await searchTests(searchQuery)
      
      if (searchError) {
        setError(searchError)
        setResults([])
      } else {
        setResults(data)
        setShowDropdown(data.length > 0)
      }
    } catch (err) {
      setError('Failed to search tests')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, performSearch])

  const handleSelect = (test: MedicalTest) => {
    onSelect(test)
    setQuery('')
    setResults([])
    setShowDropdown(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-amber-600">{error}</p>
      )}

      {/* Results dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((test) => (
            <button
              key={test.id}
              type="button"
              onClick={() => handleSelect(test)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              <div className="font-medium text-sm text-gray-900">{test.test_name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                {test.test_code && (
                  <span className="text-xs text-gray-500">Code: {test.test_code}</span>
                )}
                {test.category && (
                  <span className="text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                    {test.category}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showDropdown && query.length >= 2 && !loading && results.length === 0 && !error && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-500 text-center">No tests found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  )
}
