-- =====================================================
-- Task Messages System - Database Migration
-- =====================================================

-- 1. Create task_messages table
CREATE TABLE IF NOT EXISTS public.task_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.task_messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Team members and admins can view task messages" ON public.task_messages;
    DROP POLICY IF EXISTS "Team members and admins can post task messages" ON public.task_messages;
END $$;

-- Policies for viewing messages
-- Users can view messages for any task they have access to view
CREATE POLICY "Team members and admins can view task messages" ON public.task_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks
            WHERE tasks.id = task_messages.task_id
        )
    );

-- Policies for posting messages
-- Team members and admins can post to any task they can view
CREATE POLICY "Team members and admins can post task messages" ON public.task_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.tasks
            WHERE tasks.id = task_messages.task_id
        )
    );

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_task_messages_task_id ON public.task_messages(task_id);
CREATE INDEX IF NOT EXISTS idx_task_messages_sender_id ON public.task_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_task_messages_created_at ON public.task_messages(created_at);
