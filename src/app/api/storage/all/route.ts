import { NextRequest, NextResponse } from 'next/server';
import { getAllUserFiles, getAllUserFolders, getStorageStats } from '@/lib/data/storage';

/**
 * GET: Returns ALL files, folders, and stats for a user.
 * Used by the AI assistant to have complete storage awareness.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const [files, folders, stats] = await Promise.all([
            getAllUserFiles(userId),
            getAllUserFolders(userId),
            getStorageStats(userId),
        ]);

        // Build folder path map for context
        const folderMap: Record<string, string> = {};
        const buildPath = (folderId: string): string => {
            if (folderMap[folderId]) return folderMap[folderId];
            const folder = folders.find(f => f.id === folderId);
            if (!folder) return '';
            if (!folder.parent_id) {
                folderMap[folderId] = folder.name;
                return folder.name;
            }
            const parentPath = buildPath(folder.parent_id);
            const fullPath = parentPath ? `${parentPath}/${folder.name}` : folder.name;
            folderMap[folderId] = fullPath;
            return fullPath;
        };

        folders.forEach(f => buildPath(f.id));

        // Enrich files with folder path
        const enrichedFiles = files.map(f => ({
            id: f.id,
            name: f.file_name,
            size: f.file_size,
            mime_type: f.mime_type,
            folder_id: f.folder_id,
            folder_path: f.folder_id ? folderMap[f.folder_id] || 'root' : 'root',
            tags: f.tags,
            ai_category: f.ai_category,
            ai_summary: f.ai_summary,
            is_starred: f.is_starred,
            created_at: f.created_at,
        }));

        const enrichedFolders = folders.map(f => ({
            id: f.id,
            name: f.name,
            parent_id: f.parent_id,
            path: folderMap[f.id] || f.name,
            created_at: f.created_at,
        }));

        return NextResponse.json({
            files: enrichedFiles,
            folders: enrichedFolders,
            stats,
        });
    } catch (error: any) {
        console.error('Storage all GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
