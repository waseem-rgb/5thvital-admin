'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdmin } from '@/lib/auth/requireAdmin'
import { revalidatePath } from 'next/cache'
import { Page, ContentJsonV2, emptyContentJsonV2 } from '@/lib/types'

// Validate slug format: lowercase, hyphens, no special characters
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

async function ensureAdmin(): Promise<{ ok: boolean; error?: string }> {
  const result = await checkAdmin()

  if (!result.isAuthenticated) {
    return { ok: false, error: 'Not authenticated' }
  }

  if (!result.ok || !result.admin) {
    return { ok: false, error: 'Not authorized' }
  }

  return { ok: true }
}

// Get all pages
export async function getPages(): Promise<{ data: Page[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .order('slug', { ascending: true })

    if (error) {
      console.error('Error fetching pages:', error)
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('Error in getPages:', err)
    return { data: null, error: 'Failed to fetch pages' }
  }
}

// Get single page by slug
export async function getPageBySlug(slug: string): Promise<{ data: Page | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: 'Page not found' }
      }
      console.error('Error fetching page:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Error in getPageBySlug:', err)
    return { data: null, error: 'Failed to fetch page' }
  }
}

// Create a new page
export async function createPage(
  slug: string,
  title: string
): Promise<{ data: Page | null; error: string | null }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { data: null, error: auth.error || 'Not authorized' }
    }

    // Validate inputs
    if (!slug || !title) {
      return { data: null, error: 'Slug and title are required' }
    }

    const normalizedSlug = slug.toLowerCase().trim()
    
    if (!isValidSlug(normalizedSlug)) {
      return { data: null, error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' }
    }

    if (normalizedSlug.length < 2) {
      return { data: null, error: 'Slug must be at least 2 characters' }
    }

    if (title.trim().length < 2) {
      return { data: null, error: 'Title must be at least 2 characters' }
    }

    const supabase = createAdminClient()

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', normalizedSlug)
      .single()

    if (existing) {
      return { data: null, error: 'A page with this slug already exists' }
    }

    // Create the page with empty v2 content
    const { data, error } = await supabase
      .from('pages')
      .insert({
        slug: normalizedSlug,
        title: title.trim(),
        content_json: emptyContentJsonV2,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating page:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/pages')
    return { data, error: null }
  } catch (err) {
    console.error('Error in createPage:', err)
    return { data: null, error: 'Failed to create page' }
  }
}

// Update page title and content
export async function updatePage(
  pageId: string,
  title: string,
  contentJson: ContentJsonV2
): Promise<{ success: boolean; error: string | null }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    if (!pageId) {
      return { success: false, error: 'Page ID is required' }
    }

    if (!title || title.trim().length < 2) {
      return { success: false, error: 'Title must be at least 2 characters' }
    }

    // Validate content JSON structure
    if (!contentJson || contentJson.version !== 2 || !Array.isArray(contentJson.sections)) {
      return { success: false, error: 'Invalid content format' }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('pages')
      .update({
        title: title.trim(),
        content_json: contentJson,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId)

    if (error) {
      console.error('Error updating page:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/pages')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error in updatePage:', err)
    return { success: false, error: 'Failed to update page' }
  }
}

// Delete a page
export async function deletePage(pageId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    if (!pageId) {
      return { success: false, error: 'Page ID is required' }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)

    if (error) {
      console.error('Error deleting page:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/pages')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error in deletePage:', err)
    return { success: false, error: 'Failed to delete page' }
  }
}
