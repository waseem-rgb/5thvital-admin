'use client'

import { FeatureGridSectionData, FeatureGridItem } from '@/lib/types'

interface FeatureGridEditorProps {
  data: FeatureGridSectionData
  onChange: (data: FeatureGridSectionData) => void
  disabled?: boolean
}

export default function FeatureGridEditor({ data, onChange, disabled }: FeatureGridEditorProps) {
  const addItem = () => {
    onChange({
      ...data,
      items: [...data.items, { title: '', description: '' }],
    })
  }

  const updateItem = (index: number, field: keyof FeatureGridItem, value: string) => {
    const newItems = [...data.items]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange({ ...data, items: newItems })
  }

  const removeItem = (index: number) => {
    onChange({
      ...data,
      items: data.items.filter((_, i) => i !== index),
    })
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= data.items.length) return
    
    const newItems = [...data.items]
    const [item] = newItems.splice(index, 1)
    newItems.splice(newIndex, 0, item)
    onChange({ ...data, items: newItems })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Heading
        </label>
        <input
          type="text"
          value={data.heading}
          onChange={(e) => onChange({ ...data, heading: e.target.value })}
          disabled={disabled}
          placeholder="Our Features"
          className="input"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Features ({data.items.length})
          </label>
          {!disabled && (
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add Feature
            </button>
          )}
        </div>

        {data.items.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">No features yet</p>
            {!disabled && (
              <button
                type="button"
                onClick={addItem}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Add your first feature
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {data.items.map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    Feature {index + 1}
                  </span>
                  {!disabled && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === data.items.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                    disabled={disabled}
                    placeholder="Feature title"
                    className="input"
                  />
                  <textarea
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    disabled={disabled}
                    placeholder="Feature description"
                    rows={2}
                    className="textarea"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
