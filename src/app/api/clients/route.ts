import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, organization, email, password } = body;

        // Note: In a real production app, you would also create a user in Supabase Auth
        // For now, we are just saving to the clients table as requested
        const { data, error } = await supabase
            .from('clients')
            .insert([
                {
                    name,
                    organization,
                    email,
                    status: 'Invited', // Default status for new accounts
                    last_login: null
                }
            ])
            .select();

        if (error) throw error;

        return NextResponse.json(data[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
