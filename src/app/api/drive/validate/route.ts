import { NextResponse } from 'next/server';
import { validateFolderAccess, listSubFolders } from '@/lib/googleDrive';

// POST: Validate that a Google Drive folder is accessible
export async function POST(request: Request) {
    try {
        const { folderId: rawInput } = await request.json();

        if (!rawInput) {
            return NextResponse.json({ error: 'Missing folderId' }, { status: 400 });
        }

        // Extract folder ID from URL or raw string
        const folderId = extractFolderId(rawInput.trim());

        const validation = await validateFolderAccess(folderId);

        if (!validation.valid) {
            return NextResponse.json({
                valid: false,
                error: validation.error
            });
        }

        // Also fetch subfolders for preview
        const subFolders = await listSubFolders(folderId);

        return NextResponse.json({
            valid: true,
            folderId,
            folderName: validation.folderName,
            subFolders: subFolders.map(f => ({ id: f.id, name: f.name }))
        });
    } catch (error: any) {
        console.error('Drive Validate Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function extractFolderId(input: string): string {
    const urlMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) return urlMatch[1];
    return input;
}
