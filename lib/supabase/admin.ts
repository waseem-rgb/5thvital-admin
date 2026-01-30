// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase service-role client for privileged server-side operations.
 * Requires SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) and NEXT_PUBLIC_SUPABASE_URL.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
