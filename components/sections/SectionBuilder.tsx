'use client'

import { useState } from 'react'
import {
  Section,
  SectionType,
  SectionData,
  ContentJsonV2,
  createEmptySectionData,
  getSectionTypeLabel,
  HeroSectionData,
  RichTextSectionData,
  FeatureGridSectionData,
  FaqSectionData,
  CalloutSectionData,
} from '@/lib/types'
import HeroEditor from './HeroEditor'
import RichTextEditor from './RichTextEditor'
import FeatureGridEditor from './FeatureGridEditor'
import FaqEditor from './FaqEditor'
import CalloutEditor from './CalloutEditor'
import SectionPreview from './SectionPreview'

interface SectionBuilderProps {
  content: ContentJsonV2
  onChange: (content: ContentJsonV2) => void
  disabled?: boolean
}

const SECTION_TYPES: { value: SectionType; label: string; icon: string }[] = [
  { value: 'hero', label: 'Hero Section', icon: '🎯' },
  { value: 'richText', label: 'Rich Text', icon: '📝' },
  { value: 'featureGrid', label: 'Feature Grid', icon: '🔲' },
  { value: 'faq', label: 'FAQ', icon: '❓' },
  { value: 'callout', label: 'Callout', icon: '📢' },
]

function generateId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export default function SectionBuilder({ content, onChange, disabled }: SectionBuilderProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    content.sections.length > 0 ? content.sections[0].id : null
  )
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showAddDropdown, setShowAddDropdown] = useState(false)

  const selectedSection = content.sections.find((s) => s.id === selectedSectionId) || null

  const addSection = (type: SectionType) => {
    const newSection: Section = {
      id: generateId(),
      type,
      data: createEmptySectionData(type),
    }

    const newContent: ContentJsonV2 = {
      ...content,
      sections: [...content.sections, newSection],
    }

    onChange(newContent)
    setSelectedSectionId(newSection.id)
    setShowAddDropdown(false)
  }

  const updateSection = (sectionId: string, newData: SectionData) => {
    const newContent: ContentJsonV2 = {
      ...content,
      sections: content.sections.map((s) =>
        s.id === sectionId ? { ...s, data: newData } : s
      ),
    }
    onChange(newContent)
  }

  const deleteSection = (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return

    const sectionIndex = content.sections.findIndex((s) => s.id === sectionId)
    const newSections = content.sections.filter((s) => s.id !== sectionId)

    const newContent: ContentJsonV2 = {
      ...content,
      sections: newSections,
    }

    onChange(newContent)

    // Select adjacent section or null
    if (newSections.length > 0) {
      const newIndex = Math.min(sectionIndex, newSections.length - 1)
      setSelectedSectionId(newSections[newIndex].id)
    } else {
      setSelectedSectionId(null)
    }
  }

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = content.sections.findIndex((s) => s.id === sectionId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= content.sections.length) return

    const newSections = [...content.sections]
    const [section] = newSections.splice(index, 1)
    newSections.splice(newIndex, 0, section)

    const newContent: ContentJsonV2 = {
      ...content,
      sections: newSections,
    }

    onChange(newContent)
  }

  const renderSectionEditor = () => {
    if (!selectedSection) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p>Select a section to edit</p>
            <p className="text-sm mt-1">or add a new section to get started</p>
          </div>
        </div>
      )
    }

    const commonProps = {
      disabled,
    }

    switch (selectedSection.type) {
      case 'hero':
        return (
          <HeroEditor
            data={selectedSection.data as HeroSectionData}
            onChange={(data) => updateSection(selectedSection.id, data)}
            {...commonProps}
          />
        )
      case 'richText':
        return (
          <RichTextEditor
            data={selectedSection.data as RichTextSectionData}
            onChange={(data) => updateSection(selectedSection.id, data)}
            {...commonProps}
          />
        )
      case 'featureGrid':
        return (
          <FeatureGridEditor
            data={selectedSection.data as FeatureGridSectionData}
            onChange={(data) => updateSection(selectedSection.id, data)}
            {...commonProps}
          />
        )
      case 'faq':
        return (
          <FaqEditor
            data={selectedSection.data as FaqSectionData}
            onChange={(data) => updateSection(selectedSection.id, data)}
            {...commonProps}
          />
        )
      case 'callout':
        return (
          <CalloutEditor
            data={selectedSection.data as CalloutSectionData}
            onChange={(data) => updateSection(selectedSection.id, data)}
            {...commonProps}
          />
        )
      default:
        return <div>Unknown section type</div>
    }
  }

  // Preview Mode
  if (isPreviewMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
          <button
            onClick={() => setIsPreviewMode(false)}
            className="btn btn-secondary text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Back to Editor
          </button>
        </div>

        {content.sections.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-500">No sections to preview</p>
          </div>
        ) : (
          <div className="space-y-4">
            {content.sections.map((section) => (
              <SectionPreview key={section.id} section={section} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Edit Mode
  return (
    <div className="flex gap-6">
      {/* Left Sidebar - Section List */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 text-sm">Sections</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewMode(true)}
                  className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                  title="Preview"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Section List */}
          <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
            {content.sections.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">
                No sections yet
              </p>
            ) : (
              content.sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`
                    group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors
                    ${selectedSectionId === section.id
                      ? 'bg-primary-100 border border-primary-300'
                      : 'hover:bg-gray-100 border border-transparent'
                    }
                  `}
                  onClick={() => setSelectedSectionId(section.id)}
                >
                  <span className="text-sm">{SECTION_TYPES.find(t => t.value === section.type)?.icon}</span>
                  <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                    {getSectionTypeLabel(section.type)}
                  </span>
                  
                  {!disabled && (
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          moveSection(section.id, 'up')
                        }}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="Move up"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          moveSection(section.id, 'down')
                        }}
                        disabled={index === content.sections.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="Move down"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSection(section.id)
                        }}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="Delete"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Section Dropdown */}
          {!disabled && (
            <div className="p-2 border-t border-gray-200 relative">
              <button
                onClick={() => setShowAddDropdown(!showAddDropdown)}
                className="w-full flex items-center justify-center gap-2 p-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Section
              </button>

              {showAddDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowAddDropdown(false)}
                  />
                  <div className="absolute bottom-full left-2 right-2 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    {SECTION_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => addSection(type.value)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {selectedSection && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                {getSectionTypeLabel(selectedSection.type)}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Edit the content for this section
              </p>
            </div>
          )}
          {renderSectionEditor()}
        </div>
      </div>
    </div>
  )
}

export { SectionPreview }
