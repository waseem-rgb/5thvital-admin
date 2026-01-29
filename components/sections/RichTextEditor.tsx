'use client'

import { RichTextSectionData } from '@/lib/types'

interface RichTextEditorProps {
  data: RichTextSectionData
  onChange: (data: RichTextSectionData) => void
  disabled?: boolean
}

export default function RichTextEditor({ data, onChange, disabled }: RichTextEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content (Markdown)
        </label>
        <textarea
          value={data.markdown}
          onChange={(e) => onChange({ markdown: e.target.value })}
          disabled={disabled}
          placeholder={`# Heading

Write your content here using **Markdown** syntax.

- List item 1
- List item 2

[Link text](https://example.com)`}
          className="textarea font-mono text-sm min-h-[250px]"
        />
        <p className="text-xs text-gray-500 mt-1">
          Supports Markdown formatting: headings, bold, italic, lists, links, etc.
        </p>
      </div>
    </div>
  )
}
