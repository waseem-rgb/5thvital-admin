'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdmin } from '@/lib/auth/requireAdmin'

// Order status type
export type OrderStatus = 'new' | 'confirmed' | 'scheduled' | 'collected' | 'reported' | 'completed' | 'cancelled'

// Order from public.bookings table
export interface Order {
  id: string
  // Patient info
  patient_name: string
  phone: string
  email?: string
  age?: number
  gender?: string
  // Address
  address?: string
  city?: string
  pincode?: string
  // Booking details
  slot_date?: string
  slot_time?: string
  amount?: number
  discount_amount?: number
  total_amount?: number
  // Status
  status: OrderStatus
  payment_mode?: string
  payment_status?: string
  // Coupon
  coupon_code?: string
  // Notes
  notes?: string
  admin_notes?: string
  // Timestamps
  created_at: string
  updated_at?: string
}

// Order item from public.booking_items table
export interface OrderItem {
  id: string
  booking_id: string
  item_type: 'test' | 'package'
  item_id?: string
  item_name: string
  item_price?: number
  quantity?: number
  created_at?: string
}

// Order with items
export interface OrderWithItems extends Order {
  items: OrderItem[]
}

// Allowed statuses for validation
const allowedStatuses: OrderStatus[] = ['new', 'confirmed', 'scheduled', 'collected', 'reported', 'completed', 'cancelled']

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
 * Get all orders with optional filters.
 * Uses admin client (service role) to ensure access to bookings.
 */
export async function getOrders(filters?: {
  status?: OrderStatus
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}): Promise<{ data: Order[]; total: number; error: string | null }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { data: [], total: 0, error: auth.error || 'Not authorized' }
    }

    // Use admin client to bypass RLS (already verified admin above)
    const supabase = createAdminClient()
    const page = filters?.page || 1
    const pageSize = filters?.pageSize || 50
    const offset = (page - 1) * pageSize

    let query = supabase
      .from('bookings')
      .select('*', { count: 'exact' })

    // Apply status filter
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    // Apply date range filter
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    // Apply search filter (phone, name, or booking id)
    if (filters?.search && filters.search.trim()) {
      const searchTerm = filters.search.trim()
      // Use OR for multiple field search
      query = query.or(`patient_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`)
    }

    // Order by created_at descending and paginate
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Error fetching orders:', error)
      return { data: [], total: 0, error: error.message }
    }

    return { data: data || [], total: count || 0, error: null }
  } catch (err) {
    console.error('Error in getOrders:', err)
    return { data: [], total: 0, error: 'Failed to fetch orders' }
  }
}

/**
 * Get a single order by ID with its items.
 */
export async function getOrderById(id: string): Promise<{ data: OrderWithItems | null; error: string | null }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { data: null, error: auth.error || 'Not authorized' }
    }

    if (!id) {
      return { data: null, error: 'Order ID is required' }
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient()

    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (bookingError) {
      if (bookingError.code === 'PGRST116') {
        return { data: null, error: 'Order not found' }
      }
      console.error('Error fetching order:', bookingError)
      return { data: null, error: bookingError.message }
    }

    // Get the booking items
    const { data: items, error: itemsError } = await supabase
      .from('booking_items')
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: true })

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      // Don't fail the whole request if items fail
    }

    return {
      data: {
        ...booking,
        items: items || [],
      } as OrderWithItems,
      error: null,
    }
  } catch (err) {
    console.error('Error in getOrderById:', err)
    return { data: null, error: 'Failed to fetch order' }
  }
}

/**
 * Update order status and/or admin notes.
 * Uses admin client (service role) for secure write.
 */
export async function updateOrderAction(input: {
  id: string
  status?: OrderStatus
  admin_notes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { success: false, error: auth.error || 'Not authorized' }
    }

    if (!input.id) {
      return { success: false, error: 'Order ID is required' }
    }

    // Validate status if provided
    if (input.status && !allowedStatuses.includes(input.status)) {
      return { success: false, error: 'Invalid status' }
    }

    const supabase = createAdminClient()

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.status !== undefined) {
      updateData.status = input.status
    }

    if (input.admin_notes !== undefined) {
      updateData.admin_notes = input.admin_notes
    }

    const { error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', input.id)

    if (error) {
      console.error('Error updating order:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/orders')
    revalidatePath(`/orders/${input.id}`)
    return { success: true }
  } catch (err) {
    console.error('Error in updateOrderAction:', err)
    return { success: false, error: 'Failed to update order' }
  }
}

/**
 * Get order counts by status for dashboard.
 */
export async function getOrderStats(): Promise<{
  total: number
  new: number
  confirmed: number
  scheduled: number
  collected: number
  reported: number
  completed: number
  cancelled: number
  error: string | null
}> {
  const defaultStats = {
    total: 0,
    new: 0,
    confirmed: 0,
    scheduled: 0,
    collected: 0,
    reported: 0,
    completed: 0,
    cancelled: 0,
    error: null as string | null,
  }

  try {
    const auth = await ensureAdmin()
    if (!auth.ok) {
      return { ...defaultStats, error: auth.error || 'Not authorized' }
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient()

    // Get total count
    const { count: total } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    // Get counts by status
    const statusCounts: Record<string, number> = {}
    for (const status of allowedStatuses) {
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', status)
      statusCounts[status] = count || 0
    }

    return {
      total: total || 0,
      new: statusCounts['new'] || 0,
      confirmed: statusCounts['confirmed'] || 0,
      scheduled: statusCounts['scheduled'] || 0,
      collected: statusCounts['collected'] || 0,
      reported: statusCounts['reported'] || 0,
      completed: statusCounts['completed'] || 0,
      cancelled: statusCounts['cancelled'] || 0,
      error: null,
    }
  } catch (err) {
    console.error('Error in getOrderStats:', err)
    return { ...defaultStats, error: 'Failed to fetch order stats' }
  }
}
