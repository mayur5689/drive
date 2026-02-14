import { NextResponse } from 'next/server';
import { supabase, createServiceClient } from '@/lib/supabase';

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

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Initialize Service Client to bypass client-side auth and direct user creation
        const serviceClient = createServiceClient();

        // 1. Create the user in Supabase Auth
        const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Automatically confirm email
            user_metadata: { full_name: name }
        });

        if (authError) throw authError;

        // 2. The SQL Trigger (on_auth_user_created) will automatically create the row in 'profiles'

        // 3. Add to the legacy 'clients' table for dashboard compatibility
        const { data, error: tableError } = await serviceClient
            .from('clients')
            .insert([
                {
                    name,
                    organization,
                    email,
                    status: 'Active', // Set to Active since account is now created
                    last_login: null
                }
            ])
            .select();

        if (tableError) {
            // Rollback auth user if table insert fails (optional but good practice)
            await serviceClient.auth.admin.deleteUser(authData.user.id);
            throw tableError;
        }

        return NextResponse.json({
            message: "Client created and account activated",
            user: authData.user,
            client: data[0]
        });

    } catch (error: any) {
        console.error("Client Creation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
