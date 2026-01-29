import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"

const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export async function requireAdmin() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in
  if (!user || !user.email) {
    redirect("/login")
  }

  // Email not in allowlist
  if (!allowedEmails.includes(user.email.toLowerCase())) {
    redirect("/not-authorized")
  }

  return {
    id: user.id,
    email: user.email,
  }
}
