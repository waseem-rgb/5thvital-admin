// lib/auth/getAdmin.ts
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { AdminRole } from '@/lib/types'

export type AdminRow = {
  id: string
  user_id: string
  email: string
  role: AdminRole
  created_at: string
}

export type GetAdminResult = {
  user: User | null
  admin: AdminRow | null
  error?: Error
}

/**
 * Get the current user and their admin record.
 * ALWAYS use getUser() on server (more reliable than getSession in SSR flows).
 * 
 * @param supabase - Supabase client instance
 * @returns Object with user and admin data
 */
export async function getAdmin(supabase: SupabaseClient): Promise<GetAdminResult> {
  // ALWAYS use getUser() on server (more reliable than getSession in SSR flows)
  const { data: userData, error: userErr } = await supabase.auth.getUser()

  if (userErr || !userData?.user) {
    return { user: null, admin: null }
  }

  const user = userData.user

  // Query admins table using user_id column (NOT id)
  // The admins table has: id (row pk), user_id (auth.users.id), email, role
  const { data: admin, error: adminErr } = await supabase
    .from('admins')
    .select('id,user_id,email,role,created_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (adminErr) {
    // If RLS blocks or query fails, treat as not authorized
    console.log('[getAdmin] Error querying admins table:', adminErr.message)
    return { user, admin: null, error: adminErr }
  }

  return { user, admin: (admin ?? null) as AdminRow | null }
}
