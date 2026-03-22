-- =============================================
-- AI Cloud Storage: Files & Folders Schema
-- =============================================

-- Folders table (virtual folder structure)
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, parent_id, name)
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

-- Files table (metadata for R2-stored files)
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    mime_type TEXT DEFAULT 'application/octet-stream',
    r2_key TEXT NOT NULL UNIQUE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    ai_summary TEXT,
    ai_category TEXT,
    is_starred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_r2_key ON files(r2_key);
CREATE INDEX IF NOT EXISTS idx_files_tags ON files USING GIN(tags);

-- Row Level Security
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY folders_select ON folders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY folders_insert ON folders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY folders_update ON folders FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY folders_delete ON folders FOR DELETE USING (user_id = auth.uid());

CREATE POLICY files_select ON files FOR SELECT USING (user_id = auth.uid());
CREATE POLICY files_insert ON files FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY files_update ON files FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY files_delete ON files FOR DELETE USING (user_id = auth.uid());

-- Service role bypass (for server-side operations)
CREATE POLICY folders_service ON folders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY files_service ON files FOR ALL USING (true) WITH CHECK (true);
