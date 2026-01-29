'use client'

import {
  Section,
  SectionType,
  HeroSectionData,
  RichTextSectionData,
  FeatureGridSectionData,
  FaqSectionData,
  CalloutSectionData,
  getSectionTypeLabel,
} from '@/lib/types'

interface SectionPreviewProps {
  section: Section
}

export default function SectionPreview({ section }: SectionPreviewProps) {
  const renderSection = () => {
    switch (section.type) {
      case 'hero':
        return <HeroPreview data={section.data as HeroSectionData} />
      case 'richText':
        return <RichTextPreview data={section.data as RichTextSectionData} />
      case 'featureGrid':
        return <FeatureGridPreview data={section.data as FeatureGridSectionData} />
      case 'faq':
        return <FaqPreview data={section.data as FaqSectionData} />
      case 'callout':
        return <CalloutPreview data={section.data as CalloutSectionData} />
      default:
        return <UnknownSectionPreview type={section.type} />
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {getSectionTypeLabel(section.type)}
        </span>
      </div>
      <div className="p-4">
        {renderSection()}
      </div>
    </div>
  )
}

// Hero Section Preview
function HeroPreview({ data }: { data: HeroSectionData }) {
  const hasContent = data.title || data.subtitle || data.ctaText

  if (!hasContent) {
    return <EmptyState>No hero content defined</EmptyState>
  }

  return (
    <div className="text-center py-8 bg-gradient-to-b from-primary-50 to-white rounded-lg">
      {data.title && (
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{data.title}</h1>
      )}
      {data.subtitle && (
        <p className="text-gray-600 mb-4 max-w-lg mx-auto">{data.subtitle}</p>
      )}
      {data.ctaText && (
        <div className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium">
          {data.ctaText}
          {data.ctaHref && (
            <span className="text-primary-200 ml-2 text-xs">→ {data.ctaHref}</span>
          )}
        </div>
      )}
    </div>
  )
}

// Rich Text Section Preview
function RichTextPreview({ data }: { data: RichTextSectionData }) {
  if (!data.markdown) {
    return <EmptyState>No content written</EmptyState>
  }

  // Simple markdown rendering (basic formatting)
  const renderMarkdown = (text: string) => {
    // Split into paragraphs
    const paragraphs = text.split(/\n\n+/)
    
    return paragraphs.map((paragraph, i) => {
      // Check for headings
      if (paragraph.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-semibold text-gray-900 mt-4 mb-2">{paragraph.slice(4)}</h3>
      }
      if (paragraph.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-semibold text-gray-900 mt-4 mb-2">{paragraph.slice(3)}</h2>
      }
      if (paragraph.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-bold text-gray-900 mt-4 mb-2">{paragraph.slice(2)}</h1>
      }
      
      // Check for lists
      if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
        const items = paragraph.split('\n').filter(line => line.startsWith('- ') || line.startsWith('* '))
        return (
          <ul key={i} className="list-disc list-inside space-y-1 my-2">
            {items.map((item, j) => (
              <li key={j} className="text-gray-700">{item.slice(2)}</li>
            ))}
          </ul>
        )
      }
      
      // Regular paragraph with basic formatting
      let content = paragraph
      // Bold
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      content = content.replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Links (simplified)
      content = content.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary-600 underline">$1</a>')
      
      return (
        <p 
          key={i} 
          className="text-gray-700 my-2"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )
    })
  }

  return (
    <div className="prose prose-sm max-w-none">
      {renderMarkdown(data.markdown)}
    </div>
  )
}

// Feature Grid Section Preview
function FeatureGridPreview({ data }: { data: FeatureGridSectionData }) {
  if (data.items.length === 0) {
    return <EmptyState>No features added</EmptyState>
  }

  return (
    <div>
      {data.heading && (
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{data.heading}</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.items.map((item, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-lg p-4 border border-gray-100"
          >
            <h3 className="font-medium text-gray-900 mb-1">
              {item.title || <span className="text-gray-400 italic">Untitled</span>}
            </h3>
            <p className="text-sm text-gray-600">
              {item.description || <span className="text-gray-400 italic">No description</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// FAQ Section Preview
function FaqPreview({ data }: { data: FaqSectionData }) {
  if (data.items.length === 0) {
    return <EmptyState>No questions added</EmptyState>
  }

  return (
    <div>
      {data.heading && (
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{data.heading}</h2>
      )}
      <div className="space-y-3">
        {data.items.map((item, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-lg p-4 border border-gray-100"
          >
            <h4 className="font-medium text-gray-900 mb-2">
              Q: {item.q || <span className="text-gray-400 italic">No question</span>}
            </h4>
            <p className="text-sm text-gray-600">
              A: {item.a || <span className="text-gray-400 italic">No answer</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Callout Section Preview
function CalloutPreview({ data }: { data: CalloutSectionData }) {
  if (!data.text) {
    return <EmptyState>No callout text</EmptyState>
  }

  const toneStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
  }

  const toneIcons = {
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    danger: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
  }

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${toneStyles[data.tone]}`}>
      <span className="flex-shrink-0">{toneIcons[data.tone]}</span>
      <p className="text-sm">{data.text}</p>
    </div>
  )
}

// Unknown Section Preview
function UnknownSectionPreview({ type }: { type: SectionType }) {
  return (
    <div className="text-center py-4 text-gray-500">
      <p>Unknown section type: {type}</p>
    </div>
  )
}

// Empty State Component
function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center py-8 text-gray-400 italic">
      {children}
    </div>
  )
}
