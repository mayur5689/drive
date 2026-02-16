import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        const supabase = createServiceClient();
        const query = supabase
            .from('requests')
            .select(`
                *,
                client:client_id (full_name, email),
                assignee:assigned_to (full_name)
            `);

        if (id) {
            const { data, error } = await query.eq('id', id).single();
            if (error) throw error;
            return NextResponse.json(data);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
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
