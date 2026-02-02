-- ============================================
-- Coupons Table Setup Migration
-- Creates public.coupons table for discount management
-- ============================================

-- Create coupons table if not exists
CREATE TABLE IF NOT EXISTS public.coupons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Coupon code (unique, uppercase)
    code text NOT NULL UNIQUE,
    
    -- Discount type and value
    type text NOT NULL DEFAULT 'percent' CHECK (type IN ('percent', 'flat')),
    value numeric NOT NULL CHECK (value > 0),
    
    -- Status
    active boolean NOT NULL DEFAULT true,
    
    -- Validity dates (optional)
    starts_at timestamptz,
    ends_at timestamptz,
    
    -- Usage limits
    min_order_amount numeric DEFAULT 0,
    max_discount numeric, -- Only for percent type
    max_uses int, -- NULL means unlimited
    used_count int NOT NULL DEFAULT 0,
    
    -- Description for admin reference
    description text,
    
    -- Timestamps
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_percent_value CHECK (
        type != 'percent' OR (value > 0 AND value <= 100)
    ),
    CONSTRAINT valid_dates CHECK (
        starts_at IS NULL OR ends_at IS NULL OR starts_at <= ends_at
    )
);

-- Add comment
COMMENT ON TABLE public.coupons IS 'Discount coupons for booking apply flow';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(active);
CREATE INDEX IF NOT EXISTS idx_coupons_dates ON public.coupons(starts_at, ends_at);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS coupons_updated_at ON public.coupons;
CREATE TRIGGER coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- Add coupon fields to bookings if not exist
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'coupon_code'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN coupon_code text;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'discount_amount'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN discount_amount numeric DEFAULT 0;
    END IF;
END $$;

-- ============================================
-- RLS Policies for coupons
-- ============================================

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to manage coupons
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
    ON public.coupons
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('super_admin', 'admin')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE admins.user_id = auth.uid()
            AND admins.role IN ('super_admin', 'admin')
        )
    );

-- Policy: Allow anyone to validate coupons (read only active coupons)
DROP POLICY IF EXISTS "Anyone can validate coupons" ON public.coupons;
CREATE POLICY "Anyone can validate coupons"
    ON public.coupons
    FOR SELECT
    TO anon, authenticated
    USING (active = true);

-- Grant service role full access
GRANT ALL ON public.coupons TO service_role;

-- ============================================
-- Helper function to validate coupon
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_coupon(
    p_code text,
    p_subtotal numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coupon record;
    v_discount numeric;
    v_final_amount numeric;
    v_now timestamptz := now();
BEGIN
    -- Find coupon
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE UPPER(code) = UPPER(p_code)
    AND active = true;
    
    -- Check if coupon exists
    IF v_coupon IS NULL THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Invalid coupon code'
        );
    END IF;
    
    -- Check date validity
    IF v_coupon.starts_at IS NOT NULL AND v_now < v_coupon.starts_at THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Coupon is not yet active'
        );
    END IF;
    
    IF v_coupon.ends_at IS NOT NULL AND v_now > v_coupon.ends_at THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Coupon has expired'
        );
    END IF;
    
    -- Check usage limit
    IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Coupon usage limit reached'
        );
    END IF;
    
    -- Check minimum order amount
    IF v_coupon.min_order_amount IS NOT NULL AND p_subtotal < v_coupon.min_order_amount THEN
        RETURN json_build_object(
            'valid', false,
            'error', format('Minimum order amount is ₹%s', v_coupon.min_order_amount)
        );
    END IF;
    
    -- Calculate discount
    IF v_coupon.type = 'percent' THEN
        v_discount := p_subtotal * (v_coupon.value / 100);
        -- Apply max discount cap if set
        IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
            v_discount := v_coupon.max_discount;
        END IF;
    ELSE
        v_discount := v_coupon.value;
    END IF;
    
    -- Ensure discount doesn't exceed subtotal
    IF v_discount > p_subtotal THEN
        v_discount := p_subtotal;
    END IF;
    
    v_final_amount := p_subtotal - v_discount;
    
    RETURN json_build_object(
        'valid', true,
        'code', v_coupon.code,
        'type', v_coupon.type,
        'value', v_coupon.value,
        'discount', v_discount,
        'subtotal', p_subtotal,
        'final_amount', v_final_amount,
        'description', COALESCE(v_coupon.description, 
            CASE 
                WHEN v_coupon.type = 'percent' THEN format('%s%% off', v_coupon.value)
                ELSE format('₹%s off', v_coupon.value)
            END
        )
    );
END;
$$;

-- Grant execute on validation function
GRANT EXECUTE ON FUNCTION public.validate_coupon TO anon, authenticated;
