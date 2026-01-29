// lib/auth/requireAdmin.ts
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdmin, type GetAdminResult, type AdminRow } from './getAdmin'
import type { AdminRole } from '@/lib/types'

export interface RequireAdminOptions {
  requiredRole?: AdminRole[]
}

/**
 * Server-side function to require admin access.
 * Redirects to /login if not authenticated.
 * Returns null if authenticated but not an admin.
 * 
 * @param options - Optional role requirements
 * @returns Admin record or null
 */
export async function requireAdmin(options?: RequireAdminOptions): Promise<AdminRow | null> {
  const supabase = await createClient()
  
  // Check authentication using getUser() (most reliable for SSR)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get admin record
  const { admin } = await getAdmin(supabase)
  
  if (!admin) {
    // User is authenticated but not an admin
    // This will be handled by the layout to show "Not Authorized" message
    return null
  }

  // Check role requirement if specified
  if (options?.requiredRole && !options.requiredRole.includes(admin.role)) {
    return null
  }

  return admin
}

/**
 * Server-side function to check admin status without redirecting.
 * Useful for conditional rendering in layouts.
 * 
 * @returns Object with admin record and authentication status
 */
export async function checkAdmin(): Promise<{ admin: AdminRow | null; isAuthenticated: boolean }> {
  const supabase = await createClient()
  
  // Check authentication using getUser() (most reliable for SSR)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { admin: null, isAuthenticated: false }
  }

  // Get admin record
  const { admin } = await getAdmin(supabase)
  
  return { admin, isAuthenticated: true }
}

// Re-export types for convenience
export type { GetAdminResult, AdminRow } from './getAdmin'
