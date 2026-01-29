import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { AdminRole } from "@/lib/types"

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
  reason?: "NO_SESSION" | "NOT_ALLOWED" | "MISSING_ENV"
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
    return { ok: false, admin: null, isAuthenticated: false, reason: "MISSING_ENV" }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { ok: false, admin: null, isAuthenticated: false, reason: "NO_SESSION" }
  }

  const email = user.email.toLowerCase()
  
  // Check if user's email is in the allowlist (if allowlist is configured)
  if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
    return { ok: false, admin: null, isAuthenticated: true, reason: "NOT_ALLOWED" }
  }

  // User is authenticated and allowed - check admins table for role
  const { data: adminRow } = await supabase
    .from("admins")
    .select("id, email, role")
    .eq("user_id", user.id)
    .maybeSingle()

  // If no admin row, create a default one or use super_admin for allowlisted emails
  const role: AdminRole = adminRow?.role || "super_admin"

  return {
    ok: true,
    admin: {
      id: user.id,
      email,
      role,
    },
    isAuthenticated: true,
  }
}

/**
 * Helper that returns just the admin object or null.
 */
export async function requireAdmin(): Promise<AdminInfo | null> {
  const res = await checkAdmin()
  if (!res.ok) return null
  return res.admin
}
