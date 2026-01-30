'use server'

import { revalidatePath } from 'next/cache'
import { checkAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Lead } from '@/lib/types'

const allowedStatuses: Lead['status'][] = ['new', 'contacted', 'qualified', 'converted', 'closed']

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

export async function updateLeadAction(input: {
  id: string
  status: Lead['status']
  notes?: string
  follow_up_at?: string | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    if (!input.id) {
      return { success: false, error: 'Lead ID is required' }
    }

    if (!allowedStatuses.includes(input.status)) {
      return { success: false, error: 'Invalid status' }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('leads')
      .update({
        status: input.status,
        notes: input.notes || null,
        follow_up_at: input.follow_up_at || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/leads')
    return { success: true }
  } catch (err) {
    console.error('Error in updateLeadAction:', err)
    return { success: false, error: 'Failed to update lead' }
  }
}
