import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/coupons/validate
 * 
 * Public endpoint for validating coupon codes.
 * Used by the public booking portal to check if a coupon is valid
 * and calculate the discount amount.
 * 
 * Request body:
 * {
 *   code: string,    // Coupon code
 *   subtotal: number // Order subtotal before discount
 * }
 * 
 * Response:
 * {
 *   valid: boolean,
 *   error?: string,
 *   code?: string,
 *   type?: 'percent' | 'flat',
 *   value?: number,
 *   discount?: number,
 *   subtotal?: number,
 *   final_amount?: number,
 *   description?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, subtotal } = body

    // Validate input
    if (!code || typeof code !== 'string' || code.trim().length < 2) {
      return NextResponse.json(
        { valid: false, error: 'Invalid coupon code' },
        { status: 400 }
      )
    }

    if (subtotal === undefined || typeof subtotal !== 'number' || subtotal < 0) {
      return NextResponse.json(
        { valid: false, error: 'Invalid subtotal' },
        { status: 400 }
      )
    }

    // Create Supabase client with anon key (public access)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json(
        { valid: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Call the database validation function
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_code: code.trim().toUpperCase(),
      p_subtotal: subtotal,
    })

    if (error) {
      console.error('Error validating coupon:', error)
      return NextResponse.json(
        { valid: false, error: 'Failed to validate coupon' },
        { status: 500 }
      )
    }

    // Return validation result
    return NextResponse.json(data)
  } catch (err) {
    console.error('Error in coupon validation endpoint:', err)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/coupons/validate?code=XXX&subtotal=YYY
 * 
 * Alternative GET endpoint for coupon validation.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const subtotalStr = searchParams.get('subtotal')

  if (!code || !subtotalStr) {
    return NextResponse.json(
      { valid: false, error: 'Missing code or subtotal parameter' },
      { status: 400 }
    )
  }

  const subtotal = parseFloat(subtotalStr)
  if (isNaN(subtotal)) {
    return NextResponse.json(
      { valid: false, error: 'Invalid subtotal' },
      { status: 400 }
    )
  }

  // Reuse POST logic
  const fakeRequest = {
    json: async () => ({ code, subtotal }),
  } as NextRequest

  return POST(fakeRequest)
}
