-- 1. Create Requests Table
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('Todo', 'In Progress', 'Done')) DEFAULT 'Todo',
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Request Messages Table
CREATE TABLE IF NOT EXISTS public.request_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Requests
-- Admins can do everything
CREATE POLICY "Admins have full access to requests" ON public.requests
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Clients can only see and manage their own requests
CREATE POLICY "Clients can view their own requests" ON public.requests
    FOR SELECT TO authenticated
    USING (client_id = auth.uid());

CREATE POLICY "Clients can create their own requests" ON public.requests
    FOR INSERT TO authenticated
    WITH CHECK (client_id = auth.uid());

-- 5. RLS Policies for Request Messages
-- Admins can do everything
CREATE POLICY "Admins have full access to messages" ON public.request_messages
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Clients can see messages for their own requests
CREATE POLICY "Clients can view messages for their requests" ON public.request_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.requests
            WHERE requests.id = request_messages.request_id AND requests.client_id = auth.uid()
        )
    );

-- Clients can send messages to their own requests
CREATE POLICY "Clients can send messages to their requests" ON public.request_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.requests
            WHERE requests.id = request_messages.request_id AND requests.client_id = auth.uid()
        ) AND sender_id = auth.uid()
    );

-- 6. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_messages;
