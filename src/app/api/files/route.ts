import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import {
    ensureFolderPath,
    uploadFileToDrive,
    renameFileInDrive,
    deleteFileFromDrive,
    getOrCreateFolder,
    getRootFolderId
} from '@/lib/googleDrive';

// ─── GET: Build the virtual file tree ───
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const callerRole = searchParams.get('role');
        const callerId = searchParams.get('user_id');

        const supabase = createServiceClient();

        // 1. Fetch ALL clients
        const { data: allClients, error: cliErr } = await supabase
            .from('clients')
            .select('id, name, organization, email, status');

        if (cliErr) throw cliErr;

        // 2. Fetch all profiles
        const { data: profiles, error: profErr } = await supabase
            .from('profiles')
            .select('id, email, full_name, role');

        if (profErr) throw profErr;

        // 3. Fetch all requests
        const { data: requests, error: reqErr } = await supabase
            .from('requests')
            .select('id, title, client_id, assigned_to');

        if (reqErr) throw reqErr;

        // 4. Fetch all messages with attachments
        const { data: messages, error: msgErr } = await supabase
            .from('request_messages')
            .select('id, request_id, sender_id, attachments, created_at')
            .not('attachments', 'eq', '[]')
            .order('created_at', { ascending: true });

        if (msgErr) throw msgErr;

        // ─── Mapping ───
        const profileMap = new Map<string, any>();
        (profiles || []).forEach((p: any) => profileMap.set(p.id, p));

        // Profile ID -> Client Record
        const profileIdToClient = new Map<string, any>();
        console.log('BUILDING MAPPING - ALL CLIENTS:', allClients?.length);
        console.log('BUILDING MAPPING - PROFILES:', profiles?.length);

        for (const profile of (profiles || [])) {
            if (!profile.email) continue;
            const matchingClient = (allClients || []).find(
                (c: any) => c.email?.trim().toLowerCase() === profile.email?.trim().toLowerCase()
            );
            if (matchingClient) {
                profileIdToClient.set(profile.id, matchingClient);
                console.log(`MAPPED profile ${profile.full_name} (${profile.id}) -> client ${matchingClient.organization || matchingClient.name}`);
            } else {
                console.warn(`COULD NOT MAP profile ${profile.full_name} (${profile.email}) to any client`);
            }
        }

        const requestMap = new Map<string, any>();
        (requests || []).forEach((r: any) => requestMap.set(r.id, r));

        // ─── Build Tree ───
        const clientTree = new Map<number, any>();

        // Init tree with ALL clients
        for (const client of (allClients || [])) {
            // Filter if caller is a client
            if (callerRole === 'client') {
                const clientProfileId = (profiles || []).find(
                    (p: any) => p.email?.trim().toLowerCase() === client.email?.trim().toLowerCase()
                )?.id;
                if (clientProfileId !== callerId) continue;
            }

            clientTree.set(client.id, {
                client_id: client.id,
                client_name: client.organization || client.name,
                client_full_name: client.name,
                client_email: client.email,
                requests: new Map<string, any>()
            });
        }

        // Add requests to client nodes
        for (const req of (requests || [])) {
            const client = profileIdToClient.get(req.client_id);
            if (!client || !clientTree.has(client.id)) continue;

            // Team filtering
            if (callerRole === 'team_member' && req.assigned_to !== callerId) continue;

            const clientEntry = clientTree.get(client.id)!;
            if (!clientEntry.requests.has(req.id)) {
                clientEntry.requests.set(req.id, {
                    request_id: req.id,
                    request_title: req.title,
                    production: [],
                    distributed: []
                });
            }
        }

        // Add files to requests
        for (const msg of (messages || [])) {
            const attachments = msg.attachments as any[];
            if (!attachments || attachments.length === 0) continue;

            const req = requestMap.get(msg.request_id);
            if (!req) continue;

            const client = profileIdToClient.get(req.client_id);
            if (!client || !clientTree.has(client.id)) continue;

            const clientEntry = clientTree.get(client.id)!;
            if (!clientEntry.requests.has(req.id)) continue;

            const senderProfile = profileMap.get(msg.sender_id);
            const folder = senderProfile?.role === 'client' ? 'distributed' : 'production';

            const reqEntry = clientEntry.requests.get(req.id);
            for (let i = 0; i < attachments.length; i++) {
                const att = attachments[i];
                reqEntry[folder].push({
                    message_id: msg.id,
                    attachment_index: i,
                    name: att.name,
                    url: att.url,
                    type: att.type || 'application/octet-stream',
                    drive_file_id: att.drive_file_id || null,
                    uploaded_at: msg.created_at,
                    uploaded_by: senderProfile?.full_name || 'Unknown'
                });
            }
        }

        // Convert to array
        const result = Array.from(clientTree.values()).map((c: any) => ({
            ...c,
            requests: Array.from(c.requests.values())
        }));

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Files API GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ─── POST: Upload file ───
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const requestId = formData.get('request_id') as string;
        const folder = formData.get('folder') as string;
        const senderId = formData.get('sender_id') as string;

        if (!file || !requestId || !folder || !senderId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Get request client profile email
        const { data: req, error: reqErr } = await supabase
            .from('requests')
            .select('title, client_id')
            .eq('id', requestId)
            .single();

        if (reqErr) throw reqErr;

        const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', req.client_id)
            .single();

        const { data: client } = await supabase
            .from('clients')
            .select('organization, name')
            .ilike('email', profile?.email || '')
            .maybeSingle();

        const clientName = client?.organization || client?.name || profile?.full_name || 'Unknown';

        // Upload to Drive
        const folderId = await ensureFolderPath(clientName, req.title, folder as any);
        const { fileId, webViewLink } = await uploadFileToDrive(
            folderId,
            file.name,
            Buffer.from(await file.arrayBuffer()),
            file.type
        );

        const attachment = {
            name: file.name,
            url: webViewLink,
            type: file.type,
            drive_file_id: fileId
        };

        const { data: msg, error: msgErr } = await supabase
            .from('request_messages')
            .insert([{
                request_id: requestId,
                sender_id: senderId,
                message: `📁 File uploaded to ${folder}`,
                attachments: [attachment]
            }])
            .select()
            .single();

        if (msgErr) throw msgErr;

        return NextResponse.json({ success: true, message: msg });
    } catch (error: any) {
        console.error('Files API POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ─── PATCH: Rename ───
export async function PATCH(request: Request) {
    try {
        const { message_id, attachment_index, new_name } = await request.json();
        const supabase = createServiceClient();

        const { data: msg, error: fetchErr } = await supabase
            .from('request_messages')
            .select('attachments')
            .eq('id', message_id)
            .single();

        if (fetchErr || !msg) throw new Error('Message not found');

        const attachments = [...(msg.attachments as any[])];
        const att = attachments[attachment_index];

        if (att.drive_file_id) await renameFileInDrive(att.drive_file_id, new_name);

        attachments[attachment_index] = { ...att, name: new_name };
        await supabase.from('request_messages').update({ attachments }).eq('id', message_id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Files API PATCH Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ─── DELETE: Delete ───
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const messageId = searchParams.get('message_id');
        const attachmentIndex = parseInt(searchParams.get('attachment_index') || '0');

        const supabase = createServiceClient();
        const { data: msg, error: fetchErr } = await supabase
            .from('request_messages')
            .select('attachments')
            .eq('id', messageId)
            .single();

        if (fetchErr || !msg) throw new Error('Message not found');

        const attachments = [...(msg.attachments as any[])];
        const att = attachments[attachmentIndex];

        if (att.drive_file_id) {
            try {
                await deleteFileFromDrive(att.drive_file_id);
            } catch (e) {
                console.warn('Drive delete failed:', e);
            }
        }

        attachments.splice(attachmentIndex, 1);
        if (attachments.length === 0) {
            await supabase.from('request_messages').delete().eq('id', messageId);
        } else {
            await supabase.from('request_messages').update({ attachments }).eq('id', messageId);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Files API DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
