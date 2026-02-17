import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { validateFolderAccess } from '@/lib/googleDrive';

// GET: Fetch all app settings
export async function GET() {
    try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('app_settings')
            .select('*');

        if (error) throw error;

        // Convert to key-value object
        const settings: Record<string, string> = {};
        (data || []).forEach((row: any) => {
            settings[row.key] = row.value;
        });

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error('Settings GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Update a setting
export async function PATCH(request: Request) {
    try {
        const { key, value } = await request.json();

        if (!key || !value) {
            return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
        }

        // If updating drive folder, validate access first
        if (key === 'drive_root_folder_id') {
            const folderId = extractFolderId(value);
            const validation = await validateFolderAccess(folderId);
            if (!validation.valid) {
                return NextResponse.json({
                    error: `Cannot access folder: ${validation.error}`
                }, { status: 400 });
            }

            // Save the clean folder ID
            const supabase = createServiceClient();
            const { error } = await supabase
                .from('app_settings')
                .upsert({ key, value: folderId, updated_at: new Date().toISOString() }, { onConflict: 'key' });

            if (error) throw error;

            return NextResponse.json({
                success: true,
                folderName: validation.folderName,
                folderId
            });
        }

        // Generic setting update
        const supabase = createServiceClient();
        const { error } = await supabase
            .from('app_settings')
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Settings PATCH Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Extract folder ID from a Google Drive URL or raw ID.
 * Supports:
 * - https://drive.google.com/drive/folders/FOLDER_ID
 * - https://drive.google.com/drive/u/0/folders/FOLDER_ID
 * - Raw folder ID string
 */
function extractFolderId(input: string): string {
    const trimmed = input.trim();

    // Match Drive folder URLs
    const urlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) return urlMatch[1];

    // If no URL pattern, assume it's a raw ID
    return trimmed;
}
