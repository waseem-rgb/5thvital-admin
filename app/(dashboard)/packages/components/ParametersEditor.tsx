'use client'

import { useState } from 'react'
import { PackageParameter } from '@/lib/types'
import { MedicalTest } from '@/lib/actions/tests'
import TestSearchInput from './TestSearchInput'

interface ParametersEditorProps {
  parameters: PackageParameter[]
  onChange: (parameters: PackageParameter[]) => void
  disabled?: boolean
}

export default function ParametersEditor({ parameters, onChange, disabled = false }: ParametersEditorProps) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(
    parameters.length > 0 ? 0 : null
  )

  const addCategory = () => {
    if (!newCategoryName.trim()) return

    const newCategory: PackageParameter = {
      category: newCategoryName.trim(),
      count: 0,
      items: [],
    }

    onChange([...parameters, newCategory])
    setNewCategoryName('')
    setSelectedCategoryIndex(parameters.length)
  }

  const removeCategory = (index: number) => {
    const newParams = parameters.filter((_, i) => i !== index)
    onChange(newParams)
    
    if (selectedCategoryIndex === index) {
      setSelectedCategoryIndex(newParams.length > 0 ? 0 : null)
    } else if (selectedCategoryIndex !== null && selectedCategoryIndex > index) {
      setSelectedCategoryIndex(selectedCategoryIndex - 1)
    }
  }

  const renameCategoryDialog = (index: number) => {
    const currentName = parameters[index].category
    const newName = window.prompt('Rename category:', currentName)
    
    if (newName && newName.trim() && newName !== currentName) {
      const newParams = [...parameters]
      newParams[index] = { ...newParams[index], category: newName.trim() }
      onChange(newParams)
    }
  }

  const addTestToCategory = (test: MedicalTest) => {
    if (selectedCategoryIndex === null) {
      alert('Please select a category first')
      return
    }

    const newParams = [...parameters]
    const category = newParams[selectedCategoryIndex]

    // Check if test already exists in this category
    if (category.items.includes(test.test_name)) {
      alert('This test is already in this category')
      return
    }

    category.items = [...category.items, test.test_name]
    category.count = category.items.length

    onChange(newParams)
  }

  const addManualItem = (categoryIndex: number) => {
    const itemName = window.prompt('Enter test/parameter name:')
    
    if (itemName && itemName.trim()) {
      const newParams = [...parameters]
      const category = newParams[categoryIndex]

      if (category.items.includes(itemName.trim())) {
        alert('This item already exists in this category')
        return
      }

      category.items = [...category.items, itemName.trim()]
      category.count = category.items.length

      onChange(newParams)
    }
  }

  const removeItem = (categoryIndex: number, itemIndex: number) => {
    const newParams = [...parameters]
    const category = newParams[categoryIndex]

    category.items = category.items.filter((_, i) => i !== itemIndex)
    category.count = category.items.length

    onChange(newParams)
  }

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        {parameters.map((param, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setSelectedCategoryIndex(index)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategoryIndex === index
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {param.category} ({param.count})
          </button>
        ))}
        
        {/* Add Category */}
        {!disabled && (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
              placeholder="New category..."
              className="px-2 py-1 text-sm border border-gray-300 rounded-lg w-32 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="button"
              onClick={addCategory}
              disabled={!newCategoryName.trim()}
              className="px-2 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Selected Category Content */}
      {selectedCategoryIndex !== null && parameters[selectedCategoryIndex] && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
              {parameters[selectedCategoryIndex].category}
              <span className="ml-2 text-sm text-gray-500">
                ({parameters[selectedCategoryIndex].count} tests)
              </span>
            </h4>
            
            {!disabled && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => renameCategoryDialog(selectedCategoryIndex)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => removeCategory(selectedCategoryIndex)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete Category
                </button>
              </div>
            )}
          </div>

          {/* Search and Add Tests */}
          {!disabled && (
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Search &amp; Add Tests from Catalog
              </label>
              <TestSearchInput 
                onSelect={addTestToCategory}
                placeholder="Search medical tests to add..."
              />
              <p className="text-xs text-gray-500">
                Or{' '}
                <button
                  type="button"
                  onClick={() => addManualItem(selectedCategoryIndex)}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  add manually
                </button>
              </p>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-1">
            {parameters[selectedCategoryIndex].items.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-4 text-center">
                No tests in this category. Use the search above to add tests.
              </p>
            ) : (
              parameters[selectedCategoryIndex].items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg group"
                >
                  <span className="text-sm text-gray-700">{item}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeItem(selectedCategoryIndex, itemIndex)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {parameters.length === 0 && (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
          <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm text-gray-600 mb-2">No parameter categories yet</p>
          <p className="text-xs text-gray-500">
            Create categories like &quot;Lipid Profile&quot;, &quot;Liver Function&quot;, etc. to organize tests.
          </p>
        </div>
      )}

      {/* JSON Preview (collapsed by default) */}
      <details className="mt-4">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          View JSON data
        </summary>
        <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs overflow-x-auto">
          {JSON.stringify(parameters, null, 2)}
        </pre>
      </details>
    </div>
  )
}
