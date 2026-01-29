// lib/supabase/browser.ts
import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in Client Components.
 * Uses browser cookies automatically via document.cookie.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Alias for backwards compatibility
export const createClient = createSupabaseBrowserClient
