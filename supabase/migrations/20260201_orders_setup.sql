-- ============================================
-- Orders Setup Migration
-- Adds status and admin_notes columns to bookings table
-- ============================================

-- Add status column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN status text DEFAULT 'new' 
        CHECK (status IN ('new', 'confirmed', 'scheduled', 'collected', 'reported', 'completed', 'cancelled'));
        
        COMMENT ON COLUMN public.bookings.status IS 'Order status: new → confirmed → scheduled → collected → reported → completed (or cancelled)';
    END IF;
END $$;

-- Add admin_notes column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN admin_notes text;
        
        COMMENT ON COLUMN public.bookings.admin_notes IS 'Internal notes visible only to admins';
    END IF;
END $$;

-- Add updated_at column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update updated_at on bookings
DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Create index on created_at for faster date filtering
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- ============================================
-- RLS Policies for bookings (if not already set)
-- ============================================

-- Enable RLS on bookings if not enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to read all bookings
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings"
    ON public.bookings
    FOR SELECT
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

-- Policy: Allow admins to update bookings
DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;
CREATE POLICY "Admins can update bookings"
    ON public.bookings
    FOR UPDATE
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

-- Grant service role full access (for admin writes)
GRANT ALL ON public.bookings TO service_role;
GRANT ALL ON public.booking_items TO service_role;
