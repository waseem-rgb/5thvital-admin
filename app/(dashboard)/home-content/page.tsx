import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { canEdit } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'
import HomeContentEditor from './HomeContentEditor'

// Home content keys stored in settings table
const HOME_CONTENT_KEYS = [
  'home_hero',
  'home_stats',
  'home_pricing',
  'home_testimonials',
  'home_contact',
  'home_seo',
] as const

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

const defaultHomeContent: HomeContent = {
  hero: {
    title: 'Book Lab Tests at Home',
    subtitle: 'Get accurate results with home sample collection',
    cta_text: 'Book Now',
    cta_link: '/packages',
  },
  stats: {
    tests_count: '500+',
    happy_customers: '10,000+',
    cities_served: '20+',
    years_experience: '5+',
  },
  pricing: {
    tagline: 'Affordable Health Checkups',
    highlight_text: 'Starting from ₹299',
    packages_heading: 'Our Health Packages',
    packages_subheading: 'Choose from our comprehensive range of health packages',
  },
  testimonials: {
    heading: 'What Our Customers Say',
    subheading: 'Trusted by thousands of happy customers',
  },
  contact: {
    phone: '',
    email: '',
    whatsapp: '',
    address: '',
  },
  seo: {
    meta_title: '5thVital - Lab Tests at Home',
    meta_description: 'Book lab tests with home sample collection. Accurate results, affordable prices.',
  },
}

async function getHomeContent(): Promise<HomeContent> {
  const supabase = await createClient()

  // Get all home content settings
  const { data: settings, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', HOME_CONTENT_KEYS)

  if (error) {
    console.error('Error fetching home content:', error)
    return defaultHomeContent
  }

  // Merge with defaults
  const content = { ...defaultHomeContent }
  
  for (const setting of settings || []) {
    const key = setting.key as string
    const value = setting.value as Record<string, unknown>
    
    if (key === 'home_hero' && value) {
      content.hero = { ...content.hero, ...value }
    } else if (key === 'home_stats' && value) {
      content.stats = { ...content.stats, ...value }
    } else if (key === 'home_pricing' && value) {
      content.pricing = { ...content.pricing, ...value }
    } else if (key === 'home_testimonials' && value) {
      content.testimonials = { ...content.testimonials, ...value }
    } else if (key === 'home_contact' && value) {
      content.contact = { ...content.contact, ...value }
    } else if (key === 'home_seo' && value) {
      content.seo = { ...content.seo, ...value }
    }
  }

  return content
}

export default async function HomeContentPage() {
  const { admin } = await checkAdmin()
  
  if (!admin) return null

  const content = await getHomeContent()
  const isEditable = canEdit(admin.role)

  return (
    <AdminLayout title="Home Content" role={admin.role} email={admin.email}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Homepage Content</h2>
            <p className="text-sm text-gray-600">
              Edit the content displayed on your public homepage
            </p>
          </div>
        </div>

        {/* Content Editor */}
        <HomeContentEditor content={content} canEdit={isEditable} />
      </div>
    </AdminLayout>
  )
}
