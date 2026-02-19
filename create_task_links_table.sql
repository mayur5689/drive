-- Create the join table for many-to-many relationship between tasks and requests
CREATE TABLE IF NOT EXISTS public.task_request_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(task_id, request_id)
);

-- Enable RLS
ALTER TABLE public.task_request_links ENABLE ROW LEVEL SECURITY;

-- DROP EXISTING POLICIES TO PREVENT "ALREADY EXISTS" ERRORS
DROP POLICY IF EXISTS "Allow authenticated users to read task links" ON public.task_request_links;
DROP POLICY IF EXISTS "Allow authenticated users to insert task links" ON public.task_request_links;
DROP POLICY IF EXISTS "Allow authenticated users to update task links" ON public.task_request_links;
DROP POLICY IF EXISTS "Allow authenticated users to delete task links" ON public.task_request_links;

-- RE-CREATE POLICIES
CREATE POLICY "Allow authenticated users to read task links"
    ON public.task_request_links FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert task links"
    ON public.task_request_links FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update task links"
    ON public.task_request_links FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to delete task links"
    ON public.task_request_links FOR DELETE
    TO authenticated
    USING (true);
