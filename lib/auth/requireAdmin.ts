import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { AdminRole } from "@/lib/types"
import { ADMIN_ALLOWED_ROLES } from "@/lib/types"

// Comma-separated allowlist, e.g.:
// ADMIN_ALLOWED_EMAILS="a@x.com,b@y.com"
const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

// Debug logging helper - only logs when ADMIN_DEBUG=1
function debugLog(...args: unknown[]) {
  if (process.env.ADMIN_DEBUG === "1") {
    console.log("[checkAdmin]", ...args)
  }
}

async function getSupabaseServerClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env missing, we return null and handle gracefully.
  if (!url || !anon) return null

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // The `setAll` method is called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

export type AdminInfo = {
  id: string
  email: string
  role: AdminRole
}

export type CheckAdminResult = {
  ok: boolean
  admin: AdminInfo | null
  isAuthenticated: boolean
  reason?: "NO_SESSION" | "NOT_ALLOWED" | "MISSING_ENV" | "NO_ADMIN_ROLE"
}

/**
 * Backward-compatible function used across dashboard pages.
 * Returns:
 *  - { ok: true, admin: { id, email, role }, isAuthenticated: true }
 *  - { ok: false, admin: null, isAuthenticated: boolean, reason: string }
 * 
 * Authorization flow:
 * 1. Check if user is authenticated
 * 2. If ADMIN_ALLOWED_EMAILS is set, check email allowlist first
 * 3. Query public.user_roles table for user's role (PRIMARY)
 * 4. Fallback to public.admins table (LEGACY)
 * 5. If no role found but email is in allowlist, grant super_admin
 */
export async function checkAdmin(): Promise<CheckAdminResult> {
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    debugLog("DENY: MISSING_ENV - Supabase client not created")
    return { ok: false, admin: null, isAuthenticated: false, reason: "MISSING_ENV" }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // DEBUG: Log session info (never log tokens)
  debugLog("Session user:", user ? { id: user.id, email: user.email } : "NO USER")

  if (!user || !user.email) {
    debugLog("DENY: NO_SESSION - No user or email in session")
    return { ok: false, admin: null, isAuthenticated: false, reason: "NO_SESSION" }
  }

  const email = user.email.toLowerCase()
  
  // Check if user's email is in the allowlist (if allowlist is configured)
  // If allowlist is empty, skip this check entirely
  if (allowedEmails.length > 0) {
    debugLog("Allowlist check - emails:", allowedEmails, "user email:", email)
    if (!allowedEmails.includes(email)) {
      debugLog("DENY: NOT_ALLOWED - Email not in allowlist")
      return { ok: false, admin: null, isAuthenticated: true, reason: "NOT_ALLOWED" }
    }
    debugLog("Email allowlist passed")
  } else {
    debugLog("No email allowlist configured, checking DB role only")
  }

  // STEP 1: Query public.user_roles table (PRIMARY source of truth)
  // This table should have: user_id (auth.users.id), role (text or enum)
  const { data: userRoleRow, error: userRoleError } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .eq("user_id", user.id)
    .maybeSingle()

  debugLog("user_roles table query:", { userRoleRow, error: userRoleError?.message || null })

  // Check if we found a role in user_roles table
  if (userRoleRow && userRoleRow.role) {
    const role = userRoleRow.role as AdminRole
    const isAllowedRole = ADMIN_ALLOWED_ROLES.includes(role)
    
    debugLog("Found user_roles row - role:", role, "allowed:", isAllowedRole)
    
    if (isAllowedRole) {
      debugLog("ALLOW: User has admin role from user_roles table")
      return {
        ok: true,
        admin: {
          id: user.id,
          email,
          role,
        },
        isAuthenticated: true,
      }
    } else {
      debugLog("DENY: NO_ADMIN_ROLE - Role not in allowed list (user_roles)")
      return { ok: false, admin: null, isAuthenticated: true, reason: "NO_ADMIN_ROLE" }
    }
  }

  // STEP 2: Fallback to public.admins table (LEGACY support)
  // This allows backward compatibility with existing admin records
  const { data: adminRow, error: adminError } = await supabase
    .from("admins")
    .select("id, user_id, email, role")
    .eq("user_id", user.id)
    .maybeSingle()

  debugLog("admins table query (fallback):", { adminRow, error: adminError?.message || null })

  // If there's an admin row, check if their role is allowed
  if (adminRow && adminRow.role) {
    const role = adminRow.role as AdminRole
    const isAllowedRole = ADMIN_ALLOWED_ROLES.includes(role)
    
    debugLog("Found admins row (fallback) - role:", role, "allowed:", isAllowedRole)
    
    if (isAllowedRole) {
      debugLog("ALLOW: User has admin role from admins table (fallback)")
      return {
        ok: true,
        admin: {
          id: user.id,
          email,
          role,
        },
        isAuthenticated: true,
      }
    } else {
      debugLog("DENY: NO_ADMIN_ROLE - Role not in allowed list (admins fallback)")
      return { ok: false, admin: null, isAuthenticated: true, reason: "NO_ADMIN_ROLE" }
    }
  }

  // STEP 3: No role found in either table
  // If email allowlist is configured, grant super_admin by default
  // This allows initial setup where admin records may not exist yet
  if (allowedEmails.length > 0 && allowedEmails.includes(email)) {
    debugLog("ALLOW: Email in allowlist, granting super_admin (no DB row in either table)")
    return {
      ok: true,
      admin: {
        id: user.id,
        email,
        role: "super_admin",
      },
      isAuthenticated: true,
    }
  }

  // No admin row and no allowlist match - deny access
  debugLog("DENY: NO_ADMIN_ROLE - No role found in user_roles or admins tables, not in allowlist")
  return { ok: false, admin: null, isAuthenticated: true, reason: "NO_ADMIN_ROLE" }
}

/**
 * Helper that returns just the admin object or null.
 */
export async function requireAdmin(): Promise<AdminInfo | null> {
  const res = await checkAdmin()
  if (!res.ok) return null
  return res.admin
}
