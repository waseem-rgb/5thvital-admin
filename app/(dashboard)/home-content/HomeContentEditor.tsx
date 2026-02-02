'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSettingAction, createSettingAction } from '@/lib/actions/settings'

interface HomeContent {
  hero: {
    title: string
    subtitle: string
    cta_text: string
    cta_link: string
    image_url?: string
  }
  stats: {
    tests_count: string
    happy_customers: string
    cities_served: string
    years_experience: string
  }
  pricing: {
    tagline: string
    highlight_text: string
    packages_heading: string
    packages_subheading: string
  }
  testimonials: {
    heading: string
    subheading: string
  }
  contact: {
    phone: string
    email: string
    whatsapp: string
    address: string
  }
  seo: {
    meta_title: string
    meta_description: string
    og_image?: string
  }
}

interface HomeContentEditorProps {
  content: HomeContent
  canEdit: boolean
}

type SectionKey = 'hero' | 'stats' | 'pricing' | 'testimonials' | 'contact' | 'seo'

export default function HomeContentEditor({ content, canEdit }: HomeContentEditorProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<SectionKey>('hero')
  const [formData, setFormData] = useState<HomeContent>(content)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const sections: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
    {
      key: 'hero',
      label: 'Hero Section',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: 'stats',
      label: 'Statistics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      key: 'pricing',
      label: 'Pricing Text',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: 'testimonials',
      label: 'Testimonials',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      key: 'contact',
      label: 'Contact Info',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    {
      key: 'seo',
      label: 'SEO Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
  ]

  const handleChange = (section: SectionKey, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
    setHasChanges(true)
    setSuccess(false)
  }

  const handleSave = async () => {
    if (!canEdit) return
    
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Save all sections
      const sectionsToSave = [
        { key: 'home_hero', value: formData.hero },
        { key: 'home_stats', value: formData.stats },
        { key: 'home_pricing', value: formData.pricing },
        { key: 'home_testimonials', value: formData.testimonials },
        { key: 'home_contact', value: formData.contact },
        { key: 'home_seo', value: formData.seo },
      ]

      for (const section of sectionsToSave) {
        // Try to update first
        const updateResult = await updateSettingAction({
          key: section.key,
          valueJson: JSON.stringify(section.value),
        })

        // If update fails (key doesn't exist), create it
        if (!updateResult.success) {
          const createResult = await createSettingAction({
            key: section.key,
            valueJson: JSON.stringify(section.value),
            description: `Homepage ${section.key.replace('home_', '')} content`,
          })

          if (!createResult.success) {
            throw new Error(createResult.error || `Failed to save ${section.key}`)
          }
        }
      }

      setSuccess(true)
      setHasChanges(false)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving home content:', err)
      setError(err instanceof Error ? err.message : 'Failed to save content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Section Navigation */}
      <div className="lg:col-span-1">
        <div className="card p-4 sticky top-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Sections</h3>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === section.key
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Editor */}
      <div className="lg:col-span-3 space-y-6">
        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
            Content saved successfully!
          </div>
        )}

        {/* Hero Section */}
        {activeSection === 'hero' && (
          <SectionCard title="Hero Section" description="Main banner content on the homepage">
            <div className="space-y-4">
              <InputField
                label="Title"
                value={formData.hero.title}
                onChange={(v) => handleChange('hero', 'title', v)}
                disabled={!canEdit}
                placeholder="Book Lab Tests at Home"
              />
              <InputField
                label="Subtitle"
                value={formData.hero.subtitle}
                onChange={(v) => handleChange('hero', 'subtitle', v)}
                disabled={!canEdit}
                placeholder="Get accurate results with home sample collection"
                multiline
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="CTA Button Text"
                  value={formData.hero.cta_text}
                  onChange={(v) => handleChange('hero', 'cta_text', v)}
                  disabled={!canEdit}
                  placeholder="Book Now"
                />
                <InputField
                  label="CTA Button Link"
                  value={formData.hero.cta_link}
                  onChange={(v) => handleChange('hero', 'cta_link', v)}
                  disabled={!canEdit}
                  placeholder="/packages"
                />
              </div>
              <InputField
                label="Hero Image URL (optional)"
                value={formData.hero.image_url || ''}
                onChange={(v) => handleChange('hero', 'image_url', v)}
                disabled={!canEdit}
                placeholder="https://..."
              />
            </div>
          </SectionCard>
        )}

        {/* Stats Section */}
        {activeSection === 'stats' && (
          <SectionCard title="Statistics" description="Key numbers displayed on homepage">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Tests Count"
                value={formData.stats.tests_count}
                onChange={(v) => handleChange('stats', 'tests_count', v)}
                disabled={!canEdit}
                placeholder="500+"
              />
              <InputField
                label="Happy Customers"
                value={formData.stats.happy_customers}
                onChange={(v) => handleChange('stats', 'happy_customers', v)}
                disabled={!canEdit}
                placeholder="10,000+"
              />
              <InputField
                label="Cities Served"
                value={formData.stats.cities_served}
                onChange={(v) => handleChange('stats', 'cities_served', v)}
                disabled={!canEdit}
                placeholder="20+"
              />
              <InputField
                label="Years of Experience"
                value={formData.stats.years_experience}
                onChange={(v) => handleChange('stats', 'years_experience', v)}
                disabled={!canEdit}
                placeholder="5+"
              />
            </div>
          </SectionCard>
        )}

        {/* Pricing Section */}
        {activeSection === 'pricing' && (
          <SectionCard title="Pricing Text" description="Text shown in the pricing/packages section">
            <div className="space-y-4">
              <InputField
                label="Tagline"
                value={formData.pricing.tagline}
                onChange={(v) => handleChange('pricing', 'tagline', v)}
                disabled={!canEdit}
                placeholder="Affordable Health Checkups"
              />
              <InputField
                label="Highlight Text"
                value={formData.pricing.highlight_text}
                onChange={(v) => handleChange('pricing', 'highlight_text', v)}
                disabled={!canEdit}
                placeholder="Starting from ₹299"
              />
              <InputField
                label="Packages Heading"
                value={formData.pricing.packages_heading}
                onChange={(v) => handleChange('pricing', 'packages_heading', v)}
                disabled={!canEdit}
                placeholder="Our Health Packages"
              />
              <InputField
                label="Packages Subheading"
                value={formData.pricing.packages_subheading}
                onChange={(v) => handleChange('pricing', 'packages_subheading', v)}
                disabled={!canEdit}
                placeholder="Choose from our comprehensive range..."
                multiline
              />
            </div>
          </SectionCard>
        )}

        {/* Testimonials Section */}
        {activeSection === 'testimonials' && (
          <SectionCard title="Testimonials" description="Section headers for customer reviews">
            <div className="space-y-4">
              <InputField
                label="Section Heading"
                value={formData.testimonials.heading}
                onChange={(v) => handleChange('testimonials', 'heading', v)}
                disabled={!canEdit}
                placeholder="What Our Customers Say"
              />
              <InputField
                label="Section Subheading"
                value={formData.testimonials.subheading}
                onChange={(v) => handleChange('testimonials', 'subheading', v)}
                disabled={!canEdit}
                placeholder="Trusted by thousands of happy customers"
              />
            </div>
          </SectionCard>
        )}

        {/* Contact Section */}
        {activeSection === 'contact' && (
          <SectionCard title="Contact Information" description="Contact details shown on homepage">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Phone Number"
                value={formData.contact.phone}
                onChange={(v) => handleChange('contact', 'phone', v)}
                disabled={!canEdit}
                placeholder="+91 98765 43210"
              />
              <InputField
                label="Email Address"
                value={formData.contact.email}
                onChange={(v) => handleChange('contact', 'email', v)}
                disabled={!canEdit}
                placeholder="hello@5thvital.com"
              />
              <InputField
                label="WhatsApp Number"
                value={formData.contact.whatsapp}
                onChange={(v) => handleChange('contact', 'whatsapp', v)}
                disabled={!canEdit}
                placeholder="+91 98765 43210"
              />
              <div className="col-span-2">
                <InputField
                  label="Address"
                  value={formData.contact.address}
                  onChange={(v) => handleChange('contact', 'address', v)}
                  disabled={!canEdit}
                  placeholder="123 Health Street, Mumbai"
                  multiline
                />
              </div>
            </div>
          </SectionCard>
        )}

        {/* SEO Section */}
        {activeSection === 'seo' && (
          <SectionCard title="SEO Settings" description="Meta tags for search engines">
            <div className="space-y-4">
              <InputField
                label="Meta Title"
                value={formData.seo.meta_title}
                onChange={(v) => handleChange('seo', 'meta_title', v)}
                disabled={!canEdit}
                placeholder="5thVital - Lab Tests at Home"
              />
              <InputField
                label="Meta Description"
                value={formData.seo.meta_description}
                onChange={(v) => handleChange('seo', 'meta_description', v)}
                disabled={!canEdit}
                placeholder="Book lab tests with home sample collection..."
                multiline
              />
              <InputField
                label="OG Image URL (optional)"
                value={formData.seo.og_image || ''}
                onChange={(v) => handleChange('seo', 'og_image', v)}
                disabled={!canEdit}
                placeholder="https://..."
              />
            </div>
          </SectionCard>
        )}

        {/* Save Button */}
        {canEdit && (
          <div className="flex items-center justify-end gap-4">
            {hasChanges && (
              <span className="text-sm text-amber-600">You have unsaved changes</span>
            )}
            <button
              onClick={handleSave}
              disabled={loading || !hasChanges}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {children}
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  multiline,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  multiline?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          rows={3}
          className="input resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="input"
        />
      )}
    </div>
  )
}
