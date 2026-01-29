import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

// Comma-separated allowlist, e.g.:
// ADMIN_ALLOWED_EMAILS="a@x.com,b@y.com"
const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

function getSupabaseServerClient() {
  const cookieStore = cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env missing, we return null and handle gracefully.
  if (!url || !anon) return null

  return createServerClient(url, anon, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

/**
 * Backward-compatible function used across dashboard pages.
 * Returns:
 *  - { ok: true, admin: { id, email, role: "admin" } }
 *  - { ok: false, reason: "NO_SESSION" | "NOT_ALLOWED" | "MISSING_ENV" }
 */
export async function checkAdmin(): Promise<
  | { ok: true; admin: { id: string; email: string; role: "admin" } }
  | { ok: false; reason: "NO_SESSION" | "NOT_ALLOWED" | "MISSING_ENV" }
> {
  const supabase = getSupabaseServerClient()
  if (!supabase) return { ok: false, reason: "MISSING_ENV" }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) return { ok: false, reason: "NO_SESSION" }

  const email = user.email.toLowerCase()
  if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
    return { ok: false, reason: "NOT_ALLOWED" }
  }

  return { ok: true, admin: { id: user.id, email, role: "admin" } }
}

/**
 * New helper if you want to use it later.
 * (Not required by existing code.)
 */
export async function requireAdmin() {
  const res = await checkAdmin()
  if (!res.ok) return null
  return res.admin
}
