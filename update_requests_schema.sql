-- Add updated_at column to requests table
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add new sidebar fields
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS service TEXT;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS time_estimate TEXT;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for requests table
DROP TRIGGER IF EXISTS update_requests_updated_at ON public.requests;
CREATE TRIGGER update_requests_updated_at
    BEFORE UPDATE ON public.requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update status constraint to include 'Review'
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE public.requests ADD CONSTRAINT requests_status_check CHECK (status IN ('Todo', 'In Progress', 'Review', 'Done'));
