import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { ensureFolderPath } from '@/lib/googleDrive';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        const supabase = createServiceClient();
        const query = supabase
            .from('requests')
            .select(`
                *,
                client:client_id (id, full_name, email),
                assignee:assigned_to (id, full_name)
            `);

        if (id) {
            const { data, error } = await query.eq('id', id).single();
            if (error) throw error;

            // Fetch organization from clients table
            if (data.client?.email) {
                const { data: clientData } = await supabase
                    .from('clients')
                    .select('organization')
                    .eq('email', data.client.email)
                    .maybeSingle();

                if (clientData) {
                    data.client.organization = clientData.organization;
                }

                // Calculate request number for this client
                const { count } = await supabase
                    .from('requests')
                    .select('*', { count: 'exact', head: true })
                    .eq('client_id', data.client_id)
                    .lte('created_at', data.created_at);

                data.request_number = count;
            }

            return NextResponse.json(data);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // Fetch organizations for all clients if it's a list
        const clientEmails = data
            .map(r => r.client?.email)
            .filter(Boolean);

        if (clientEmails.length > 0) {
            const { data: clientsData } = await supabase
                .from('clients')
                .select('email, organization')
                .in('email', clientEmails);

            if (clientsData) {
                data.forEach(r => {
                    if (r.client?.email) {
                        const c = clientsData.find(cd => cd.email === r.client.email);
                        if (c) r.client.organization = c.organization;
                    }
                });
            }
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, client_id, priority, due_date } = body;

        if (!title || !client_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('requests')
            .insert([
                {
                    title,
                    description,
                    client_id,
                    priority: priority || 'Medium',
                    due_date,
                    status: 'Todo'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // Auto-create Google Drive folder for this request (only if requested)
        if (body.create_folder !== false) {
            try {
                // Fetch client name for folder structure
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email, full_name')
                    .eq('id', client_id)
                    .single();

                const { data: client } = await supabase
                    .from('clients')
                    .select('organization, name, drive_folder_id')
                    .ilike('email', profile?.email || '')
                    .maybeSingle();

                const clientName = client?.organization || client?.name || profile?.full_name || 'Unknown';

                // Create the folder structure: Client -> Request
                await ensureFolderPath(clientName, title, 'production', client?.drive_folder_id);
            } catch (err) {
                console.warn('Could not create Drive folder for request:', err);
            }
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const body = await request.json();

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('requests')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const supabase = createServiceClient();
        const { error } = await supabase
            .from('requests')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
