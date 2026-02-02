'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdmin } from '@/lib/auth/requireAdmin'
import { revalidatePath } from 'next/cache'

// Medical test type
export interface MedicalTest {
  id: string
  test_name: string
  test_code?: string
  category?: string
  sample_type?: string
  description?: string
  normal_range?: string
  unit?: string
  price?: number
  turnaround_time?: string
  created_at?: string
  updated_at?: string
}

async function ensureAdmin(): Promise<{ ok: boolean; error?: string }> {
  const result = await checkAdmin()

  if (!result.isAuthenticated) {
    return { ok: false, error: 'Not authenticated' }
  }

  if (!result.ok || !result.admin) {
    return { ok: false, error: 'Not authorized' }
  }

  return { ok: true }
}

/**
 * Search medical tests by name or code.
 * This is a read operation using the server client (anon key).
 */
export async function searchTests(query: string, limit: number = 20): Promise<{
  data: MedicalTest[]
  error: string | null
}> {
  try {
    if (!query || query.trim().length < 2) {
      return { data: [], error: null }
    }

    const supabase = await createClient()
    const searchTerm = query.trim().toLowerCase()

    // Search in medical_tests table - try different possible table names
    // The table might be: medical_tests, tests, or medical_tests_master
    const tableNames = ['medical_tests', 'tests', 'medical_tests_master', 'test_catalog']
    
    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .or(`test_name.ilike.%${searchTerm}%,test_code.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
          .order('test_name')
          .limit(limit)

        if (!error && data) {
          return { data: data as MedicalTest[], error: null }
        }
      } catch {
        // Table doesn't exist, try next one
        continue
      }
    }

    // If no table found, return empty
    return { data: [], error: 'Medical tests table not found' }
  } catch (err) {
    console.error('Error in searchTests:', err)
    return { data: [], error: 'Failed to search tests' }
  }
}

/**
 * Get all tests with pagination.
 */
export async function getTests(
  page: number = 1,
  pageSize: number = 50,
  searchQuery?: string
): Promise<{
  data: MedicalTest[]
  total: number
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const offset = (page - 1) * pageSize

    // Try different table names
    const tableNames = ['medical_tests', 'tests', 'medical_tests_master', 'test_catalog']
    
    for (const tableName of tableNames) {
      try {
        let query = supabase
          .from(tableName)
          .select('*', { count: 'exact' })

        if (searchQuery && searchQuery.trim().length >= 2) {
          const term = searchQuery.trim().toLowerCase()
          query = query.or(`test_name.ilike.%${term}%,test_code.ilike.%${term}%,category.ilike.%${term}%`)
        }

        const { data, error, count } = await query
          .order('test_name')
          .range(offset, offset + pageSize - 1)

        if (!error && data) {
          return { data: data as MedicalTest[], total: count || 0, error: null }
        }
      } catch {
        continue
      }
    }

    return { data: [], total: 0, error: 'Medical tests table not found' }
  } catch (err) {
    console.error('Error in getTests:', err)
    return { data: [], total: 0, error: 'Failed to fetch tests' }
  }
}

/**
 * Get a single test by ID.
 */
export async function getTestById(id: string): Promise<{
  data: MedicalTest | null
  error: string | null
}> {
  try {
    if (!id) {
      return { data: null, error: 'Test ID is required' }
    }

    const supabase = await createClient()
    const tableNames = ['medical_tests', 'tests', 'medical_tests_master', 'test_catalog']
    
    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single()

        if (!error && data) {
          return { data: data as MedicalTest, error: null }
        }
      } catch {
        continue
      }
    }

    return { data: null, error: 'Test not found' }
  } catch (err) {
    console.error('Error in getTestById:', err)
    return { data: null, error: 'Failed to fetch test' }
  }
}

/**
 * Update a medical test (admin only).
 */
export async function updateTest(
  id: string,
  input: Partial<Omit<MedicalTest, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    if (!id) {
      return { success: false, error: 'Test ID is required' }
    }

    const supabase = createAdminClient()
    const tableNames = ['medical_tests', 'tests', 'medical_tests_master', 'test_catalog']
    
    const updateData: Record<string, unknown> = {
      ...input,
      updated_at: new Date().toISOString(),
    }

    for (const tableName of tableNames) {
      try {
        const { error } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', id)

        if (!error) {
          revalidatePath('/tests')
          revalidatePath(`/tests/${id}`)
          return { success: true, error: null }
        }
      } catch {
        continue
      }
    }

    return { success: false, error: 'Failed to update test - table not found' }
  } catch (err) {
    console.error('Error in updateTest:', err)
    return { success: false, error: 'Failed to update test' }
  }
}
