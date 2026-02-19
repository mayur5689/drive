-- =====================================================
-- Add request_id to tasks table (link tasks to requests)
-- =====================================================

-- 1. Add request_id column
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL;

-- 2. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_tasks_request_id ON public.tasks(request_id);
