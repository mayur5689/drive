import { createServiceClient } from '@/lib/supabase';
import { getPresignedUrl } from '@/lib/r2';

export interface StorageFile {
    id: string;
    user_id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    r2_key: string;
    folder_id: string | null;
    tags: string[];
    ai_summary: string | null;
    ai_category: string | null;
    is_starred: boolean;
    created_at: string;
    updated_at: string;
    preview_url?: string;
}

export interface StorageFolder {
    id: string;
    user_id: string;
    name: string;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface StorageItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    mime_type?: string;
    size?: number;
    r2_key?: string;
    preview_url?: string;
    tags?: string[];
    ai_summary?: string | null;
    ai_category?: string | null;
    is_starred?: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Get folders for a user, optionally filtered by parent.
 */
export async function getUserFolders(userId: string, parentId?: string | null): Promise<StorageFolder[]> {
    const supabase = createServiceClient();
    let query = supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('name');

    if (parentId) {
        query = query.eq('parent_id', parentId);
    } else {
        query = query.is('parent_id', null);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching folders:', error);
        return [];
    }
    return data || [];
}

/**
 * Get files for a user, optionally filtered by folder.
 */
export async function getUserFiles(userId: string, folderId?: string | null): Promise<StorageFile[]> {
    const supabase = createServiceClient();
    let query = supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .order('file_name');

    if (folderId) {
        query = query.eq('folder_id', folderId);
    } else {
        query = query.is('folder_id', null);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching files:', error);
        return [];
    }

    // Add presigned URLs
    const filesWithUrls = await Promise.all(
        (data || []).map(async (file) => {
            try {
                const preview_url = await getPresignedUrl(file.r2_key);
                return { ...file, preview_url };
            } catch {
                return { ...file, preview_url: '' };
            }
        })
    );

    return filesWithUrls;
}

/**
 * Get combined storage items (folders + files) for display.
 */
export async function getStorageItems(userId: string, folderId?: string | null): Promise<StorageItem[]> {
    const [folders, files] = await Promise.all([
        getUserFolders(userId, folderId),
        getUserFiles(userId, folderId),
    ]);

    const folderItems: StorageItem[] = folders.map(f => ({
        id: f.id,
        name: f.name,
        type: 'folder',
        created_at: f.created_at,
        updated_at: f.updated_at,
    }));

    const fileItems: StorageItem[] = files.map(f => ({
        id: f.id,
        name: f.file_name,
        type: 'file',
        mime_type: f.mime_type,
        size: f.file_size,
        r2_key: f.r2_key,
        preview_url: f.preview_url,
        tags: f.tags,
        ai_summary: f.ai_summary,
        ai_category: f.ai_category,
        is_starred: f.is_starred,
        created_at: f.created_at,
        updated_at: f.updated_at,
    }));

    return [...folderItems, ...fileItems];
}

/**
 * Get a single file by ID.
 */
export async function getFileById(fileId: string): Promise<StorageFile | null> {
    const supabase = createServiceClient();
    const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

    if (error || !data) return null;

    try {
        const preview_url = await getPresignedUrl(data.r2_key);
        return { ...data, preview_url };
    } catch {
        return { ...data, preview_url: '' };
    }
}

/**
 * Search files by name, tags, or AI summary.
 */
export async function searchFiles(userId: string, query: string): Promise<StorageFile[]> {
    const supabase = createServiceClient();
    const searchTerm = `%${query}%`;

    const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .or(`file_name.ilike.${searchTerm},ai_summary.ilike.${searchTerm},ai_category.ilike.${searchTerm}`)
        .order('file_name')
        .limit(50);

    if (error) {
        console.error('Search error:', error);
        return [];
    }
    return data || [];
}

/**
 * Get storage statistics for a user.
 */
export async function getStorageStats(userId: string) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
        .from('files')
        .select('file_size, mime_type')
        .eq('user_id', userId);

    if (error || !data) {
        return { totalFiles: 0, totalSize: 0, typeCounts: {} };
    }

    const typeCounts: Record<string, number> = {};
    let totalSize = 0;

    for (const file of data) {
        totalSize += file.file_size || 0;
        const type = file.mime_type?.split('/')[0] || 'other';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    }

    return { totalFiles: data.length, totalSize, typeCounts };
}

/**
 * Create a folder.
 */
export async function createFolder(userId: string, name: string, parentId?: string | null) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
        .from('folders')
        .insert({
            user_id: userId,
            name,
            parent_id: parentId || null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Insert file metadata after R2 upload.
 */
export async function insertFile(params: {
    userId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    r2Key: string;
    folderId?: string | null;
    tags?: string[];
    aiSummary?: string;
    aiCategory?: string;
}) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
        .from('files')
        .insert({
            user_id: params.userId,
            file_name: params.fileName,
            file_size: params.fileSize,
            mime_type: params.mimeType,
            r2_key: params.r2Key,
            folder_id: params.folderId || null,
            tags: params.tags || [],
            ai_summary: params.aiSummary || null,
            ai_category: params.aiCategory || null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Rename a file or folder.
 */
export async function renameItem(id: string, newName: string, type: 'file' | 'folder') {
    const supabase = createServiceClient();
    const table = type === 'file' ? 'files' : 'folders';
    const field = type === 'file' ? 'file_name' : 'name';

    const { error } = await supabase
        .from(table)
        .update({ [field]: newName, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
}

/**
 * Delete file metadata from DB.
 */
export async function deleteFileRecord(fileId: string) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)
        .select('r2_key')
        .single();

    if (error) throw error;
    return data?.r2_key;
}

/**
 * Delete a folder and get all R2 keys of files inside it (recursively).
 */
export async function deleteFolderRecord(folderId: string): Promise<string[]> {
    const supabase = createServiceClient();

    // Get all files in this folder
    const { data: files } = await supabase
        .from('files')
        .select('r2_key')
        .eq('folder_id', folderId);

    const keys = (files || []).map(f => f.r2_key);

    // Get subfolders
    const { data: subfolders } = await supabase
        .from('folders')
        .select('id')
        .eq('parent_id', folderId);

    // Recurse into subfolders
    for (const sub of subfolders || []) {
        const subKeys = await deleteFolderRecord(sub.id);
        keys.push(...subKeys);
    }

    // Delete the folder (cascade will handle files and subfolders)
    await supabase.from('folders').delete().eq('id', folderId);

    return keys;
}

/**
 * Toggle starred status on a file.
 */
export async function toggleStarred(fileId: string, isStarred: boolean) {
    const supabase = createServiceClient();
    const { error } = await supabase
        .from('files')
        .update({ is_starred: isStarred, updated_at: new Date().toISOString() })
        .eq('id', fileId);

    if (error) throw error;
}

/**
 * Update file AI metadata.
 */
export async function updateFileAI(fileId: string, tags: string[], category: string, summary?: string) {
    const supabase = createServiceClient();
    const { error } = await supabase
        .from('files')
        .update({
            tags,
            ai_category: category,
            ai_summary: summary || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', fileId);

    if (error) throw error;
}
