import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getOrCreateFolder, getRootFolderId } from '@/lib/googleDrive';

export async function POST(request: Request) {
    try {
        const { clientId, clientName, organization } = await request.json();

        if (!clientId || !clientName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const serviceClient = createServiceClient();

        // 1. Resolve folder name
        const folderName = organization || clientName;

        // 2. Create/Get folder in Drive
        const rootId = await getRootFolderId();
        const folderId = await getOrCreateFolder(rootId, folderName);

        // 3. Update client in DB
        const { error: updateError } = await serviceClient
            .from('clients')
            .update({ drive_folder_id: folderId })
            .eq('id', clientId);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            folderId,
            folderName
        });

    } catch (error: any) {
        console.error('Client Drive Create Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
