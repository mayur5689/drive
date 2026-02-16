import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createServiceClient } from '@/lib/supabase';
import { ensureFolderPath, uploadFileToDrive } from '@/lib/googleDrive';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const requestId = formData.get('requestId') as string | null;
        const senderId = formData.get('senderId') as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // If requestId is provided, upload to Google Drive (chat attachments)
        if (requestId) {
            const supabase = createServiceClient();

            // Get request info for folder path
            const { data: req, error: reqErr } = await supabase
                .from('requests')
                .select(`
                    id, title, client_id,
                    client:client_id (id, full_name, email)
                `)
                .eq('id', requestId)
                .single();

            if (reqErr) throw reqErr;

            // Get client org name
            const { data: clientData } = await supabase
                .from('clients')
                .select('organization, name')
                .ilike('email', (req.client as any)?.email || '')
                .maybeSingle();

            const clientName = clientData?.organization || clientData?.name || (req.client as any)?.full_name || 'Unknown';

            // Determine folder based on sender role
            let folder: 'production' | 'distributed' = 'production';
            if (senderId) {
                const { data: senderProfile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', senderId)
                    .single();

                if (senderProfile?.role === 'client') {
                    folder = 'distributed';
                }
            }

            // Upload to Google Drive
            const folderId = await ensureFolderPath(clientName, req.title, folder);
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            const { fileId, webViewLink } = await uploadFileToDrive(
                folderId,
                file.name,
                fileBuffer,
                file.type
            );

            return NextResponse.json({
                url: webViewLink,
                name: file.name,
                type: file.type,
                drive_file_id: fileId
            });
        }

        // Fallback: no requestId means avatar or general upload → Supabase Storage
        const supabase = createServiceClient();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;

        const { error } = await supabase.storage
            .from('chat-attachments')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(fileName);

        return NextResponse.json({
            url: publicUrl,
            name: file.name,
            type: file.type
        });
    } catch (error: any) {
        console.error('Upload API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
