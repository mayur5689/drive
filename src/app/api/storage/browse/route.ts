import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { uploadFile, deleteFile, deleteByPrefix } from '@/lib/r2';
import {
    getStorageItems,
    getStarredFiles,
    createFolder,
    insertFile,
    renameItem,
    deleteFileRecord,
    deleteFolderRecord,
    updateFileAI,
} from '@/lib/data/storage';

/**
 * GET: List contents of a folder (or root if no folderId).
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const folderId = searchParams.get('folderId') || null;
        const userId = searchParams.get('userId');
        const starred = searchParams.get('starred');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Starred view — return only starred files across all folders
        if (starred === 'true') {
            const files = await getStarredFiles(userId);
            const items = files.map(f => ({
                id: f.id,
                name: f.file_name,
                type: 'file' as const,
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
            return NextResponse.json(items);
        }

        const items = await getStorageItems(userId, folderId);
        return NextResponse.json(items);
    } catch (error: any) {
        console.error('Storage browse GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST: Upload a file (FormData) or create a folder (JSON).
 */
export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';

        // JSON = create folder
        if (contentType.includes('application/json')) {
            const body = await req.json();
            const { userId, folderName, parentId } = body;

            if (!userId || !folderName) {
                return NextResponse.json({ error: 'userId and folderName required' }, { status: 400 });
            }

            const folder = await createFolder(userId, folderName.trim(), parentId || null);
            return NextResponse.json(folder);
        }

        // FormData = upload file
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const userId = formData.get('userId') as string;
        const folderId = formData.get('folderId') as string | null;
        const folderPath = formData.get('folderPath') as string || '';

        if (!file || !userId) {
            return NextResponse.json({ error: 'file and userId required' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const r2Key = await uploadFile(userId, folderPath, file.name, buffer, file.type);

        const fileRecord = await insertFile({
            userId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
            r2Key,
            folderId: folderId || null,
        });

        // Auto-tag via AI in background (non-blocking)
        autoTagFile(fileRecord.id, file.name, file.type).catch(() => {});

        return NextResponse.json(fileRecord);
    } catch (error: any) {
        console.error('Storage browse POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PATCH: Rename a file or folder.
 */
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, newName, type } = body;

        if (!id || !newName || !type) {
            return NextResponse.json({ error: 'id, newName, and type required' }, { status: 400 });
        }

        await renameItem(id, newName.trim(), type);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Storage browse PATCH error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE: Delete a file or folder.
 */
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const type = searchParams.get('type'); // 'file' or 'folder'

        if (!id || !type) {
            return NextResponse.json({ error: 'id and type required' }, { status: 400 });
        }

        if (type === 'file') {
            const r2Key = await deleteFileRecord(id);
            if (r2Key) {
                await deleteFile(r2Key);
            }
        } else {
            const r2Keys = await deleteFolderRecord(id);
            // Delete all files from R2
            for (const key of r2Keys) {
                await deleteFile(key).catch(() => {});
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Storage browse DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Background auto-tagging via AI.
 */
async function autoTagFile(fileId: string, fileName: string, mimeType: string) {
    try {
        const { askAIJSON } = await import('@/lib/ai');
        const prompt = `
Analyze this file and categorize it:
File Name: "${fileName}"
Mime Type: "${mimeType || 'unknown'}"

Return JSON with:
- "category": a single word category (e.g. "Invoice", "Photo", "Document", "Spreadsheet", "Video", "Design", "Code", "Presentation", "Music", "Archive")
- "tags": array of 2-3 relevant lowercase tags
- "summary": a brief 1-sentence description of what this file likely is

Return JSON: { "category": "...", "tags": ["...", "..."], "summary": "..." }
        `;
        const result = await askAIJSON(prompt);
        if (result.data) {
            await updateFileAI(
                fileId,
                result.data.tags || [],
                result.data.category || 'General',
                result.data.summary
            );
        }
    } catch (error) {
        console.error('Auto-tag error:', error);
    }
}
