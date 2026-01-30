'use server'

import { revalidatePath } from 'next/cache'
import { checkAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

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

export async function updateSettingAction(input: { key: string; valueJson: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    if (!input.key) {
      return { success: false, error: 'Setting key is required' }
    }

    let parsedValue: unknown
    try {
      parsedValue = JSON.parse(input.valueJson)
    } catch {
      return { success: false, error: 'Invalid JSON' }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('settings')
      .update({
        value: parsedValue,
        updated_at: new Date().toISOString(),
      })
      .eq('key', input.key)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    console.error('Error in updateSettingAction:', err)
    return { success: false, error: 'Failed to save setting' }
  }
}

export async function createSettingAction(input: { key: string; valueJson: string; description?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    const key = input.key?.trim()
    if (!key) {
      return { success: false, error: 'Setting key is required' }
    }

    let parsedValue: unknown
    try {
      parsedValue = JSON.parse(input.valueJson)
    } catch {
      return { success: false, error: 'Invalid JSON' }
    }

    const supabase = createAdminClient()

    const { error } = await supabase.from('settings').insert({
      key,
      value: parsedValue,
      description: input.description?.trim() || null,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    console.error('Error in createSettingAction:', err)
    return { success: false, error: 'Failed to add setting. Key may already exist.' }
  }
}

export async function deleteSettingAction(input: { key: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    if (!input.key) {
      return { success: false, error: 'Setting key is required' }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('key', input.key)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    console.error('Error in deleteSettingAction:', err)
    return { success: false, error: 'Failed to delete setting' }
  }
}
