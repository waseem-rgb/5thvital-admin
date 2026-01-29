// lib/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * Uses next/headers cookies() for cookie management.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

// Alias for backwards compatibility
export const createClient = createSupabaseServerClient
