// Admin roles
export type AdminRole = 'super_admin' | 'editor' | 'viewer'

// Admin from public.admins table
export interface Admin {
  id: string
  user_id: string
  email: string
  role: AdminRole
  created_at: string
  updated_at: string
}

// ============================================
// Section Builder Types (v2)
// ============================================

export type SectionType = 'hero' | 'richText' | 'featureGrid' | 'faq' | 'callout'

export interface HeroSectionData {
  title: string
  subtitle: string
  ctaText: string
  ctaHref: string
}

export interface RichTextSectionData {
  markdown: string
}

export interface FeatureGridItem {
  title: string
  description: string
}

export interface FeatureGridSectionData {
  heading: string
  items: FeatureGridItem[]
}

export interface FaqItem {
  q: string
  a: string
}

export interface FaqSectionData {
  heading: string
  items: FaqItem[]
}

export type CalloutTone = 'info' | 'success' | 'warning' | 'danger'

export interface CalloutSectionData {
  text: string
  tone: CalloutTone
}

export type SectionData =
  | HeroSectionData
  | RichTextSectionData
  | FeatureGridSectionData
  | FaqSectionData
  | CalloutSectionData

export interface Section {
  id: string
  type: SectionType
  data: SectionData
}

export interface ContentJsonV2 {
  version: 2
  sections: Section[]
}

// Helper to create empty section data
export function createEmptySectionData(type: SectionType): SectionData {
  switch (type) {
    case 'hero':
      return { title: '', subtitle: '', ctaText: '', ctaHref: '' }
    case 'richText':
      return { markdown: '' }
    case 'featureGrid':
      return { heading: '', items: [] }
    case 'faq':
      return { heading: '', items: [] }
    case 'callout':
      return { text: '', tone: 'info' }
  }
}

// Helper to get section type label
export function getSectionTypeLabel(type: SectionType): string {
  const labels: Record<SectionType, string> = {
    hero: 'Hero Section',
    richText: 'Rich Text',
    featureGrid: 'Feature Grid',
    faq: 'FAQ',
    callout: 'Callout',
  }
  return labels[type]
}

// Empty v2 content JSON for new pages
export const emptyContentJsonV2: ContentJsonV2 = {
  version: 2,
  sections: [],
}

// ============================================
// Page from public.pages table
// ============================================

export interface Page {
  id: string
  slug: string
  title: string
  content_json: ContentJsonV2 | Record<string, unknown>
  updated_at: string
  updated_by: string | null
}

// Lead from public.leads table
export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  message?: string
  source?: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'
  notes?: string
  follow_up_at?: string
  created_at: string
  updated_at: string
}

// Media from public.media table
export interface Media {
  id: string
  filename: string
  url: string
  mime_type: string
  size: number
  alt_text?: string
  created_at: string
  updated_at: string
}

// Setting from public.settings table
export interface Setting {
  id: string
  key: string
  value: Record<string, unknown>
  description?: string
  created_at: string
  updated_at: string
}

// Role-based permission checks
export const canEdit = (role: AdminRole): boolean => {
  return role === 'super_admin' || role === 'editor'
}

export const canManageUsers = (role: AdminRole): boolean => {
  return role === 'super_admin'
}

export const canEditSettings = (role: AdminRole): boolean => {
  return role === 'super_admin'
}
