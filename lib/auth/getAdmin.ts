// lib/auth/getAdmin.ts
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { AdminRole } from '@/lib/types'

export type AdminRow = {
  id: string
  user_id: string
  email: string
  role: AdminRole
  created_at?: string
}

export type GetAdminResult = {
  user: User | null
  admin: AdminRow | null
  error?: Error
}

// Debug logging helper - only logs when ADMIN_DEBUG=1
function debugLog(...args: unknown[]) {
  if (process.env.ADMIN_DEBUG === "1") {
    console.log("[getAdmin]", ...args)
  }
}

/**
 * Get the current user and their admin record.
 * ALWAYS use getUser() on server (more reliable than getSession in SSR flows).
 * 
 * Authorization flow:
 * 1. Query public.user_roles table for user's role (PRIMARY)
 * 2. Fallback to public.admins table (LEGACY)
 * 
 * @param supabase - Supabase client instance
 * @returns Object with user and admin data
 */
export async function getAdmin(supabase: SupabaseClient): Promise<GetAdminResult> {
  // ALWAYS use getUser() on server (more reliable than getSession in SSR flows)
  const { data: userData, error: userErr } = await supabase.auth.getUser()

  if (userErr || !userData?.user) {
    debugLog("No authenticated user found")
    return { user: null, admin: null }
  }

  const user = userData.user
  debugLog("User found:", { id: user.id, email: user.email })

  // STEP 1: Query user_roles table (PRIMARY source of truth)
  // This table should have: user_id (auth.users.id), role (text or enum)
  const { data: userRoleRow, error: userRoleErr } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  debugLog("user_roles query result:", { userRoleRow, error: userRoleErr?.message || null })

  if (userRoleRow && userRoleRow.role) {
    // Found role in user_roles table - construct admin object
    const admin: AdminRow = {
      id: user.id, // Use user.id as id since user_roles may not have separate id
      user_id: user.id,
      email: user.email || '',
      role: userRoleRow.role as AdminRole,
    }
    debugLog("Returning admin from user_roles:", admin)
    return { user, admin }
  }

  // STEP 2: Fallback to admins table (LEGACY support)
  // The admins table has: id (row pk), user_id (auth.users.id), email, role
  const { data: adminRow, error: adminErr } = await supabase
    .from('admins')
    .select('id,user_id,email,role,created_at')
    .eq('user_id', user.id)
    .maybeSingle()

  debugLog("admins query result (fallback):", { adminRow, error: adminErr?.message || null })

  if (adminErr) {
    // If RLS blocks or query fails, treat as not authorized
    debugLog("Error querying admins table:", adminErr.message)
    return { user, admin: null, error: adminErr }
  }

  if (adminRow) {
    debugLog("Returning admin from admins table (fallback):", adminRow)
    return { user, admin: adminRow as AdminRow }
  }

  // No admin record found in either table
  debugLog("No admin record found in user_roles or admins tables")
  return { user, admin: null }
}
