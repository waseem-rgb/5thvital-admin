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
 */
export async function checkAdmin(): Promise<CheckAdminResult> {
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    console.log("[checkAdmin] DENY: MISSING_ENV - Supabase client not created")
    return { ok: false, admin: null, isAuthenticated: false, reason: "MISSING_ENV" }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // DEBUG: Log session info
  console.log("[checkAdmin] Session user:", user ? { id: user.id, email: user.email } : "NO USER")

  if (!user || !user.email) {
    console.log("[checkAdmin] DENY: NO_SESSION - No user or email in session")
    return { ok: false, admin: null, isAuthenticated: false, reason: "NO_SESSION" }
  }

  const email = user.email.toLowerCase()
  
  // Check if user's email is in the allowlist (if allowlist is configured)
  // If allowlist is empty, skip this check entirely
  if (allowedEmails.length > 0) {
    console.log("[checkAdmin] Allowlist check - emails:", allowedEmails, "user email:", email)
    if (!allowedEmails.includes(email)) {
      console.log("[checkAdmin] DENY: NOT_ALLOWED - Email not in allowlist")
      return { ok: false, admin: null, isAuthenticated: true, reason: "NOT_ALLOWED" }
    }
    console.log("[checkAdmin] Email allowlist passed")
  } else {
    console.log("[checkAdmin] No email allowlist configured, checking DB role only")
  }

  // Query the admins table for role using user_id column
  const { data: adminRow, error: adminError } = await supabase
    .from("admins")
    .select("id, user_id, email, role")
    .eq("user_id", user.id)
    .maybeSingle()

  // DEBUG: Log DB query result
  console.log("[checkAdmin] admins table query:", { adminRow, error: adminError?.message || null })

  // If there's an admin row, check if their role is allowed
  if (adminRow) {
    const role = adminRow.role as AdminRole
    const isAllowedRole = ADMIN_ALLOWED_ROLES.includes(role)
    
    console.log("[checkAdmin] Found admin row - role:", role, "allowed:", isAllowedRole)
    
    if (isAllowedRole) {
      console.log("[checkAdmin] ALLOW: User has admin role")
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
      console.log("[checkAdmin] DENY: NO_ADMIN_ROLE - Role not in allowed list")
      return { ok: false, admin: null, isAuthenticated: true, reason: "NO_ADMIN_ROLE" }
    }
  }

  // No admin row found - if email allowlist is configured, grant super_admin by default
  // This allows initial setup where admin records may not exist yet
  if (allowedEmails.length > 0 && allowedEmails.includes(email)) {
    console.log("[checkAdmin] ALLOW: Email in allowlist, granting super_admin (no DB row)")
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
  console.log("[checkAdmin] DENY: NO_ADMIN_ROLE - No admin row found and not in allowlist")
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
