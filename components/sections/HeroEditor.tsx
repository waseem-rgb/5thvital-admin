'use client'

import { HeroSectionData } from '@/lib/types'

interface HeroEditorProps {
  data: HeroSectionData
  onChange: (data: HeroSectionData) => void
  disabled?: boolean
}

export default function HeroEditor({ data, onChange, disabled }: HeroEditorProps) {
  const updateField = <K extends keyof HeroSectionData>(
    field: K,
    value: HeroSectionData[K]
  ) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hero Title
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateField('title', e.target.value)}
          disabled={disabled}
          placeholder="Welcome to our site"
          className="input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subtitle
        </label>
        <input
          type="text"
          value={data.subtitle}
          onChange={(e) => updateField('subtitle', e.target.value)}
          disabled={disabled}
          placeholder="A brief description of what you offer"
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CTA Button Text
          </label>
          <input
            type="text"
            value={data.ctaText}
            onChange={(e) => updateField('ctaText', e.target.value)}
            disabled={disabled}
            placeholder="Get Started"
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CTA Button Link
          </label>
          <input
            type="text"
            value={data.ctaHref}
            onChange={(e) => updateField('ctaHref', e.target.value)}
            disabled={disabled}
            placeholder="/contact"
            className="input"
          />
        </div>
      </div>
    </div>
  )
}
