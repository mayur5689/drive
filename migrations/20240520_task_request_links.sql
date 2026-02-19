-- Migration: Create task_request_links join table
CREATE TABLE IF NOT EXISTS public.task_request_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(task_id, request_id)
);

-- Enable RLS
ALTER TABLE public.task_request_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Align with task policies)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins have full access to task_request_links" ON public.task_request_links;
    DROP POLICY IF EXISTS "Team members can view all links" ON public.task_request_links;
END $$;

CREATE POLICY "Admins have full access to task_request_links" ON public.task_request_links
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

CREATE POLICY "Team members can view all links" ON public.task_request_links
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'team_member'
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_request_links_task_id ON public.task_request_links(task_id);
CREATE INDEX IF NOT EXISTS idx_task_request_links_request_id ON public.task_request_links(request_id);
