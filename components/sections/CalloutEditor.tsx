'use client'

import { CalloutSectionData, CalloutTone } from '@/lib/types'

interface CalloutEditorProps {
  data: CalloutSectionData
  onChange: (data: CalloutSectionData) => void
  disabled?: boolean
}

const toneOptions: { value: CalloutTone; label: string; description: string }[] = [
  { value: 'info', label: 'Info', description: 'Blue - General information' },
  { value: 'success', label: 'Success', description: 'Green - Positive message' },
  { value: 'warning', label: 'Warning', description: 'Yellow - Caution' },
  { value: 'danger', label: 'Danger', description: 'Red - Important alert' },
]

export default function CalloutEditor({ data, onChange, disabled }: CalloutEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Callout Text
        </label>
        <textarea
          value={data.text}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
          disabled={disabled}
          placeholder="Enter your callout message here..."
          rows={3}
          className="textarea"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tone / Style
        </label>
        <div className="grid grid-cols-2 gap-3">
          {toneOptions.map((option) => (
            <label
              key={option.value}
              className={`
                relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                ${data.tone === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                name="callout-tone"
                value={option.value}
                checked={data.tone === option.value}
                onChange={(e) => onChange({ ...data, tone: e.target.value as CalloutTone })}
                disabled={disabled}
                className="sr-only"
              />
              <div className="flex items-center gap-3">
                <span
                  className={`
                    w-4 h-4 rounded-full
                    ${option.value === 'info' ? 'bg-blue-500' : ''}
                    ${option.value === 'success' ? 'bg-green-500' : ''}
                    ${option.value === 'warning' ? 'bg-yellow-500' : ''}
                    ${option.value === 'danger' ? 'bg-red-500' : ''}
                  `}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
