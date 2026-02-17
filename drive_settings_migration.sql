-- ============================================================
-- Migration: Dynamic Google Drive Folder Management
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create app_settings table (key-value store)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Seed the current root folder ID (update the value below if different)
INSERT INTO public.app_settings (key, value)
VALUES ('drive_root_folder_id', '1ll8Q4HJPhiESCu1vdTMdR_J0NHby4Dn7')
ON CONFLICT (key) DO NOTHING;

-- 3. Add drive_folder_id column to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS drive_folder_id TEXT DEFAULT NULL;

-- 4. RLS for app_settings — only super_admin can read/write
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read settings" ON public.app_settings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update settings" ON public.app_settings
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert settings" ON public.app_settings
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
        )
    );

-- 5. Allow service role full access (for API routes)
-- Service role bypasses RLS by default, so no extra policy needed.
