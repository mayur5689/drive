import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('request_messages')
            .select(`
                *,
                sender:sender_id (full_name, role)
            `)
            .eq('request_id', id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { message, sender_id, attachments } = body;

        if (!message || !sender_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('request_messages')
            .insert([
                {
                    request_id: id,
                    sender_id,
                    message,
                    attachments: attachments || []
                }
            ])
            .select(`
                *,
                sender:sender_id (full_name, role)
            `)
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
