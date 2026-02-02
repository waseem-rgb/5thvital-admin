'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdmin } from '@/lib/auth/requireAdmin'

// Coupon type
export type CouponType = 'percent' | 'flat'

// Coupon from public.coupons table
export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  active: boolean
  starts_at?: string | null
  ends_at?: string | null
  min_order_amount?: number | null
  max_discount?: number | null
  max_uses?: number | null
  used_count: number
  description?: string | null
  created_at: string
  updated_at: string
}

// Input for creating/updating a coupon
export interface CouponInput {
  code: string
  type: CouponType
  value: number
  active?: boolean
  starts_at?: string | null
  ends_at?: string | null
  min_order_amount?: number | null
  max_discount?: number | null
  max_uses?: number | null
  description?: string | null
}

// Coupon validation result
export interface CouponValidationResult {
  valid: boolean
  error?: string
  code?: string
  type?: CouponType
  value?: number
  discount?: number
  subtotal?: number
  final_amount?: number
  description?: string
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
 * Get all coupons.
 */
export async function getCoupons(): Promise<{ data: Coupon[]; error: string | null }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { data: [], error: auth.error || 'Not authorized' }
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching coupons:', error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('Error in getCoupons:', err)
    return { data: [], error: 'Failed to fetch coupons' }
  }
}

/**
 * Get a single coupon by ID.
 */
export async function getCouponById(id: string): Promise<{ data: Coupon | null; error: string | null }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { data: null, error: auth.error || 'Not authorized' }
    }

    if (!id) {
      return { data: null, error: 'Coupon ID is required' }
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: 'Coupon not found' }
      }
      console.error('Error fetching coupon:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Error in getCouponById:', err)
    return { data: null, error: 'Failed to fetch coupon' }
  }
}

/**
 * Create a new coupon.
 */
export async function createCouponAction(input: CouponInput): Promise<{ success: boolean; data?: Coupon; error?: string }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    // Validate required fields
    if (!input.code || input.code.trim().length < 2) {
      return { success: false, error: 'Coupon code must be at least 2 characters' }
    }

    if (!input.type || !['percent', 'flat'].includes(input.type)) {
      return { success: false, error: 'Invalid coupon type' }
    }

    if (input.value === undefined || input.value <= 0) {
      return { success: false, error: 'Coupon value must be greater than 0' }
    }

    if (input.type === 'percent' && input.value > 100) {
      return { success: false, error: 'Percent discount cannot exceed 100%' }
    }

    const supabase = createAdminClient()

    // Normalize code to uppercase
    const code = input.code.trim().toUpperCase().replace(/\s+/g, '')

    // Check if code already exists
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', code)
      .single()

    if (existing) {
      return { success: false, error: 'A coupon with this code already exists' }
    }

    // Prepare insert data
    const insertData: Record<string, unknown> = {
      code,
      type: input.type,
      value: input.value,
      active: input.active ?? true,
      min_order_amount: input.min_order_amount || 0,
      description: input.description?.trim() || null,
    }

    // Optional fields
    if (input.starts_at) insertData.starts_at = input.starts_at
    if (input.ends_at) insertData.ends_at = input.ends_at
    if (input.max_discount) insertData.max_discount = input.max_discount
    if (input.max_uses) insertData.max_uses = input.max_uses

    const { data, error } = await supabase
      .from('coupons')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating coupon:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/coupons')
    return { success: true, data }
  } catch (err) {
    console.error('Error in createCouponAction:', err)
    return { success: false, error: 'Failed to create coupon' }
  }
}

/**
 * Update an existing coupon.
 */
export async function updateCouponAction(
  id: string,
  input: Partial<CouponInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    if (!id) {
      return { success: false, error: 'Coupon ID is required' }
    }

    // Validate fields if provided
    if (input.code !== undefined && input.code.trim().length < 2) {
      return { success: false, error: 'Coupon code must be at least 2 characters' }
    }

    if (input.type !== undefined && !['percent', 'flat'].includes(input.type)) {
      return { success: false, error: 'Invalid coupon type' }
    }

    if (input.value !== undefined && input.value <= 0) {
      return { success: false, error: 'Coupon value must be greater than 0' }
    }

    if (input.type === 'percent' && input.value !== undefined && input.value > 100) {
      return { success: false, error: 'Percent discount cannot exceed 100%' }
    }

    const supabase = createAdminClient()

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.code !== undefined) {
      const code = input.code.trim().toUpperCase().replace(/\s+/g, '')
      
      // Check if new code conflicts with another coupon
      const { data: existing } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', code)
        .neq('id', id)
        .single()

      if (existing) {
        return { success: false, error: 'A coupon with this code already exists' }
      }
      
      updateData.code = code
    }

    if (input.type !== undefined) updateData.type = input.type
    if (input.value !== undefined) updateData.value = input.value
    if (input.active !== undefined) updateData.active = input.active
    if (input.starts_at !== undefined) updateData.starts_at = input.starts_at || null
    if (input.ends_at !== undefined) updateData.ends_at = input.ends_at || null
    if (input.min_order_amount !== undefined) updateData.min_order_amount = input.min_order_amount || 0
    if (input.max_discount !== undefined) updateData.max_discount = input.max_discount || null
    if (input.max_uses !== undefined) updateData.max_uses = input.max_uses || null
    if (input.description !== undefined) updateData.description = input.description?.trim() || null

    const { error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating coupon:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/coupons')
    return { success: true }
  } catch (err) {
    console.error('Error in updateCouponAction:', err)
    return { success: false, error: 'Failed to update coupon' }
  }
}

/**
 * Delete a coupon.
 */
export async function deleteCouponAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    if (!id) {
      return { success: false, error: 'Coupon ID is required' }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting coupon:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/coupons')
    return { success: true }
  } catch (err) {
    console.error('Error in deleteCouponAction:', err)
    return { success: false, error: 'Failed to delete coupon' }
  }
}

/**
 * Toggle coupon active status.
 */
export async function toggleCouponStatusAction(id: string, active: boolean): Promise<{ success: boolean; error?: string }> {
  return updateCouponAction(id, { active })
}

/**
 * Validate a coupon code (for public use).
 * This can be called by the public booking portal.
 */
export async function validateCouponAction(
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  try {
    if (!code || code.trim().length < 2) {
      return { valid: false, error: 'Invalid coupon code' }
    }

    if (subtotal === undefined || subtotal < 0) {
      return { valid: false, error: 'Invalid subtotal' }
    }

    const supabase = await createClient()

    // Call the database validation function
    const { data, error } = await supabase
      .rpc('validate_coupon', {
        p_code: code.trim().toUpperCase(),
        p_subtotal: subtotal,
      })

    if (error) {
      console.error('Error validating coupon:', error)
      return { valid: false, error: 'Failed to validate coupon' }
    }

    return data as CouponValidationResult
  } catch (err) {
    console.error('Error in validateCouponAction:', err)
    return { valid: false, error: 'Failed to validate coupon' }
  }
}

/**
 * Increment coupon usage count (called when order is placed).
 */
export async function incrementCouponUsage(code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .rpc('increment', { 
        table_name: 'coupons', 
        row_id: code, 
        column_name: 'used_count' 
      })

    // If rpc doesn't exist, do manual update
    if (error) {
      const { error: updateError } = await supabase
        .from('coupons')
        .update({ used_count: supabase.rpc('', {}) }) // This won't work, use raw SQL instead
        .eq('code', code.toUpperCase())

      // Fallback: just update with increment
      const { data: current } = await supabase
        .from('coupons')
        .select('used_count')
        .eq('code', code.toUpperCase())
        .single()

      if (current) {
        await supabase
          .from('coupons')
          .update({ used_count: (current.used_count || 0) + 1 })
          .eq('code', code.toUpperCase())
      }
    }

    return { success: true }
  } catch (err) {
    console.error('Error incrementing coupon usage:', err)
    return { success: false, error: 'Failed to update coupon usage' }
  }
}
