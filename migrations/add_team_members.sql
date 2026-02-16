-- =====================================================
-- Team Member Management System - Database Migration
-- =====================================================

-- 1. Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT,
    position TEXT,
    status TEXT CHECK (status IN ('Active', 'Inactive')) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login TIMESTAMPTZ
);

-- 2. Create request_assignments table (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.request_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
    assigned_at TIMESTAMPTZ DEFAULT now(),
    assigned_by UUID REFERENCES public.profiles(id),
    UNIQUE(request_id, team_member_id)
);

-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- 3. Enable RLS on new tables
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_assignments ENABLE ROW LEVEL SECURITY;

-- 4. Team Members Policies
-- Admins can manage all team members
CREATE POLICY "Admins have full access to team members" ON public.team_members
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Team members can view their own profile
CREATE POLICY "Team members can view own profile" ON public.team_members
    FOR SELECT TO authenticated
    USING (profile_id = auth.uid());

-- 5. Request Assignments Policies
-- Admins can manage all assignments
CREATE POLICY "Admins have full access to assignments" ON public.request_assignments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Team members can view their own assignments
CREATE POLICY "Team members can view own assignments" ON public.request_assignments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.id = request_assignments.team_member_id
            AND team_members.profile_id = auth.uid()
        )
    );

-- =====================================================
-- Update Existing Policies
-- =====================================================

-- 6. Update Requests RLS - Team members can view assigned requests
CREATE POLICY "Team members can view assigned requests" ON public.requests
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.request_assignments ra
            JOIN public.team_members tm ON ra.team_member_id = tm.id
            WHERE ra.request_id = requests.id
            AND tm.profile_id = auth.uid()
        )
    );

-- 7. Update Requests RLS - Team members with admin role can update
CREATE POLICY "Team admins can update assigned requests" ON public.requests
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.request_assignments ra
            JOIN public.team_members tm ON ra.team_member_id = tm.id
            WHERE ra.request_id = requests.id
            AND tm.profile_id = auth.uid()
            AND ra.role = 'admin'
        )
    );

-- 8. Update Messages RLS - Team members can view messages for assigned requests
CREATE POLICY "Team members can view assigned request messages" ON public.request_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.request_assignments ra
            JOIN public.team_members tm ON ra.team_member_id = tm.id
            WHERE ra.request_id = request_messages.request_id
            AND tm.profile_id = auth.uid()
        )
    );

-- 9. Update Messages RLS - Team members with Editor/Admin role can send messages
CREATE POLICY "Team members can send messages to assigned requests" ON public.request_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.request_assignments ra
            JOIN public.team_members tm ON ra.team_member_id = tm.id
            WHERE ra.request_id = request_messages.request_id
            AND tm.profile_id = auth.uid()
            AND ra.role IN ('admin', 'editor')
        ) AND sender_id = auth.uid()
    );

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_team_members_profile_id ON public.team_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_request_assignments_request_id ON public.request_assignments(request_id);
CREATE INDEX IF NOT EXISTS idx_request_assignments_team_member_id ON public.request_assignments(team_member_id);

-- =====================================================
-- Enable Realtime (Optional)
-- =====================================================

-- 11. Enable realtime for new tables (if needed)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.request_assignments;
