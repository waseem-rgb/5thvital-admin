'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdmin } from '@/lib/auth/requireAdmin'
import { revalidatePath } from 'next/cache'
import {
  PackageDetail,
  PackageCreateInput,
  PackageUpdateInput,
  PackageStatus,
  PackageParameter,
  PackageFaq
} from '@/lib/types'
import { generateSlug } from '@/lib/utils'

/**
 * Validate slug format: lowercase, letters/numbers/hyphens only.
 */
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

/**
 * Validate that a JSON string parses to an array.
 */
function validateJsonArray(jsonString: string, fieldName: string): { valid: boolean; error?: string; data?: unknown[] } {
  if (!jsonString || jsonString.trim() === '' || jsonString.trim() === '[]') {
    return { valid: true, data: [] }
  }
  
  try {
    const parsed = JSON.parse(jsonString)
    if (!Array.isArray(parsed)) {
      return { valid: false, error: `${fieldName} must be a valid JSON array` }
    }
    return { valid: true, data: parsed }
  } catch {
    return { valid: false, error: `${fieldName} contains invalid JSON` }
  }
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

/**
 * Get a single package by ID.
 */
export async function getPackageById(id: string): Promise<{ data: PackageDetail | null; error: string | null }> {
  try {
    if (!id) {
      return { data: null, error: 'Package ID is required' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: 'Package not found' }
      }
      console.error('Error fetching package:', error)
      return { data: null, error: error.message }
    }

    return { data: data as PackageDetail, error: null }
  } catch (err) {
    console.error('Error in getPackageById:', err)
    return { data: null, error: 'Failed to fetch package' }
  }
}

/**
 * Create a new package.
 */
export async function createPackage(
  input: PackageCreateInput
): Promise<{ data: PackageDetail | null; error: string | null }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { data: null, error: auth.error || 'Not authorized' }
    }

    // Validate required fields
    if (!input.title || input.title.trim().length < 2) {
      return { data: null, error: 'Title is required and must be at least 2 characters' }
    }

    // Generate slug if not provided
    let slug = input.slug?.trim()
    if (!slug) {
      slug = generateSlug(input.title)
    } else {
      slug = slug.toLowerCase()
    }

    if (!isValidSlug(slug)) {
      return { data: null, error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' }
    }

    if (slug.length < 2) {
      return { data: null, error: 'Slug must be at least 2 characters' }
    }

    const supabase = createAdminClient()

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('packages')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return { data: null, error: 'A package with this slug already exists' }
    }

    // Prepare the insert data
    const insertData: Record<string, unknown> = {
      slug,
      title: input.title.trim(),
      status: input.status || 'draft',
      is_featured: input.is_featured || false,
      sort_order: input.sort_order ?? 0,
    }

    // Optional fields
    if (input.mrp !== undefined) insertData.mrp = input.mrp
    if (input.price !== undefined) insertData.price = input.price
    if (input.discount_percent !== undefined) insertData.discount_percent = input.discount_percent
    if (input.reports_within_hours !== undefined) insertData.reports_within_hours = input.reports_within_hours
    if (input.tests_included !== undefined) insertData.tests_included = input.tests_included
    if (input.requisites !== undefined) insertData.requisites = input.requisites
    if (input.home_collection_minutes !== undefined) insertData.home_collection_minutes = input.home_collection_minutes
    if (input.highlights !== undefined) insertData.highlights = input.highlights
    if (input.description !== undefined) insertData.description = input.description
    if (input.parameters !== undefined) insertData.parameters = input.parameters
    if (input.faqs !== undefined) insertData.faqs = input.faqs

    const { data, error } = await supabase
      .from('packages')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating package:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/packages')
    return { data: data as PackageDetail, error: null }
  } catch (err) {
    console.error('Error in createPackage:', err)
    return { data: null, error: 'Failed to create package' }
  }
}

/**
 * Update an existing package.
 */
export async function updatePackage(
  id: string,
  input: PackageUpdateInput
): Promise<{ data: PackageDetail | null; error: string | null }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { data: null, error: auth.error || 'Not authorized' }
    }

    if (!id) {
      return { data: null, error: 'Package ID is required' }
    }

    // Validate title if provided
    if (input.title !== undefined && input.title.trim().length < 2) {
      return { data: null, error: 'Title must be at least 2 characters' }
    }

    // Validate slug if provided
    if (input.slug !== undefined) {
      const slug = input.slug.toLowerCase().trim()
      if (!isValidSlug(slug)) {
        return { data: null, error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' }
      }
      if (slug.length < 2) {
        return { data: null, error: 'Slug must be at least 2 characters' }
      }
    }

    const supabase = createAdminClient()

    // If slug is being changed, check for uniqueness
    if (input.slug !== undefined) {
      const slug = input.slug.toLowerCase().trim()
      const { data: existing } = await supabase
        .from('packages')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single()

      if (existing) {
        return { data: null, error: 'A package with this slug already exists' }
      }
    }

    // Prepare the update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.title !== undefined) updateData.title = input.title.trim()
    if (input.slug !== undefined) updateData.slug = input.slug.toLowerCase().trim()
    if (input.status !== undefined) updateData.status = input.status
    if (input.is_featured !== undefined) updateData.is_featured = input.is_featured
    if (input.sort_order !== undefined) updateData.sort_order = input.sort_order
    if (input.mrp !== undefined) updateData.mrp = input.mrp
    if (input.price !== undefined) updateData.price = input.price
    if (input.discount_percent !== undefined) updateData.discount_percent = input.discount_percent
    if (input.reports_within_hours !== undefined) updateData.reports_within_hours = input.reports_within_hours
    if (input.tests_included !== undefined) updateData.tests_included = input.tests_included
    if (input.requisites !== undefined) updateData.requisites = input.requisites
    if (input.home_collection_minutes !== undefined) updateData.home_collection_minutes = input.home_collection_minutes
    if (input.highlights !== undefined) updateData.highlights = input.highlights
    if (input.description !== undefined) updateData.description = input.description
    if (input.parameters !== undefined) updateData.parameters = input.parameters
    if (input.faqs !== undefined) updateData.faqs = input.faqs

    const { data, error } = await supabase
      .from('packages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating package:', error)
      return { data: null, error: error.message }
    }

    revalidatePath('/packages')
    revalidatePath(`/packages/${id}`)
    return { data: data as PackageDetail, error: null }
  } catch (err) {
    console.error('Error in updatePackage:', err)
    return { data: null, error: 'Failed to update package' }
  }
}

/**
 * Delete a package.
 */
export async function deletePackage(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    if (!id) {
      return { success: false, error: 'Package ID is required' }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting package:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/packages')
    return { success: true, error: null }
  } catch (err) {
    console.error('Error in deletePackage:', err)
    return { success: false, error: 'Failed to delete package' }
  }
}

/**
 * Server action to handle form submission for creating a package.
 * Parses form data and validates JSON fields.
 */
export async function createPackageAction(formData: FormData): Promise<{ 
  success: boolean
  data?: PackageDetail
  error?: string 
}> {
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const status = (formData.get('status') as PackageStatus) || 'draft'
  const is_featured = formData.get('is_featured') === 'true'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  const mrp = formData.get('mrp') ? parseInt(formData.get('mrp') as string) : undefined
  const price = formData.get('price') ? parseInt(formData.get('price') as string) : undefined
  const discount_percent = formData.get('discount_percent') ? parseInt(formData.get('discount_percent') as string) : undefined
  const reports_within_hours = formData.get('reports_within_hours') ? parseInt(formData.get('reports_within_hours') as string) : undefined
  const tests_included = formData.get('tests_included') ? parseInt(formData.get('tests_included') as string) : undefined
  const requisites = formData.get('requisites') as string || undefined
  const home_collection_minutes = formData.get('home_collection_minutes') ? parseInt(formData.get('home_collection_minutes') as string) : undefined
  const highlights = formData.get('highlights') as string || undefined
  const description = formData.get('description') as string || undefined
  const parametersJson = formData.get('parameters') as string || '[]'
  const faqsJson = formData.get('faqs') as string || '[]'

  // Validate JSON fields
  const parametersResult = validateJsonArray(parametersJson, 'Parameters')
  if (!parametersResult.valid) {
    return { success: false, error: parametersResult.error }
  }

  const faqsResult = validateJsonArray(faqsJson, 'FAQs')
  if (!faqsResult.valid) {
    return { success: false, error: faqsResult.error }
  }

  const result = await createPackage({
    title,
    slug,
    status,
    is_featured,
    sort_order,
    mrp,
    price,
    discount_percent,
    reports_within_hours,
    tests_included,
    requisites,
    home_collection_minutes,
    highlights,
    description,
    parameters: parametersResult.data as PackageParameter[],
    faqs: faqsResult.data as PackageFaq[],
  })

  if (result.error) {
    return { success: false, error: result.error }
  }

  return { success: true, data: result.data! }
}

/**
 * Server action to handle form submission for updating a package.
 * Parses form data and validates JSON fields.
 */
export async function updatePackageAction(id: string, formData: FormData): Promise<{ 
  success: boolean
  data?: PackageDetail
  error?: string 
}> {
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const status = (formData.get('status') as PackageStatus) || 'draft'
  const is_featured = formData.get('is_featured') === 'true'
  const sort_order = parseInt(formData.get('sort_order') as string) || 0

  const mrp = formData.get('mrp') ? parseInt(formData.get('mrp') as string) : undefined
  const price = formData.get('price') ? parseInt(formData.get('price') as string) : undefined
  const discount_percent = formData.get('discount_percent') ? parseInt(formData.get('discount_percent') as string) : undefined
  const reports_within_hours = formData.get('reports_within_hours') ? parseInt(formData.get('reports_within_hours') as string) : undefined
  const tests_included = formData.get('tests_included') ? parseInt(formData.get('tests_included') as string) : undefined
  const requisites = formData.get('requisites') as string || undefined
  const home_collection_minutes = formData.get('home_collection_minutes') ? parseInt(formData.get('home_collection_minutes') as string) : undefined
  const highlights = formData.get('highlights') as string || undefined
  const description = formData.get('description') as string || undefined
  const parametersJson = formData.get('parameters') as string || '[]'
  const faqsJson = formData.get('faqs') as string || '[]'

  // Validate JSON fields
  const parametersResult = validateJsonArray(parametersJson, 'Parameters')
  if (!parametersResult.valid) {
    return { success: false, error: parametersResult.error }
  }

  const faqsResult = validateJsonArray(faqsJson, 'FAQs')
  if (!faqsResult.valid) {
    return { success: false, error: faqsResult.error }
  }

  const result = await updatePackage(id, {
    title,
    slug,
    status,
    is_featured,
    sort_order,
    mrp,
    price,
    discount_percent,
    reports_within_hours,
    tests_included,
    requisites,
    home_collection_minutes,
    highlights,
    description,
    parameters: parametersResult.data as PackageParameter[],
    faqs: faqsResult.data as PackageFaq[],
  })

  if (result.error) {
    return { success: false, error: result.error }
  }

  return { success: true, data: result.data! }
}
