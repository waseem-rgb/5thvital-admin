'use server'

import { revalidatePath } from 'next/cache'
import { checkAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AdminRole } from '@/lib/types'

const roleOptions: AdminRole[] = ['super_admin', 'admin', 'moderator', 'editor', 'viewer', 'user']
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

export async function addAdminAction(input: { userId: string; email: string; role: AdminRole }): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    const userId = input.userId?.trim()
    const email = input.email?.trim().toLowerCase()
    const role = input.role

    if (!userId || !uuidRegex.test(userId)) {
      return { success: false, error: 'Invalid UUID format. Please enter a valid Supabase Auth user ID.' }
    }

    if (!email) {
      return { success: false, error: 'Email is required' }
    }

    if (!roleOptions.includes(role)) {
      return { success: false, error: 'Invalid role selected' }
    }

    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      return { success: false, error: 'This user is already an admin' }
    }

    const { error } = await supabase.from('admins').insert({
      user_id: userId,
      email,
      role,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/users')
    return { success: true }
  } catch (err) {
    console.error('Error in addAdminAction:', err)
    return { success: false, error: 'Failed to add admin. Make sure the user exists in Supabase Auth.' }
  }
}

export async function updateAdminRoleAction(input: { id: string; role: AdminRole }): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    if (!input.id) {
      return { success: false, error: 'Admin ID is required' }
    }

    if (!roleOptions.includes(input.role)) {
      return { success: false, error: 'Invalid role selected' }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('admins')
      .update({ role: input.role, updated_at: new Date().toISOString() })
      .eq('id', input.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/users')
    return { success: true }
  } catch (err) {
    console.error('Error in updateAdminRoleAction:', err)
    return { success: false, error: 'Failed to update role' }
  }
}

export async function deleteAdminAction(input: { id: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    if (!input.id) {
      return { success: false, error: 'Admin ID is required' }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', input.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/users')
    return { success: true }
  } catch (err) {
    console.error('Error in deleteAdminAction:', err)
    return { success: false, error: 'Failed to remove admin' }
  }
}
