import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// GET: Fetch all app settings
export async function GET() {
    try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('app_settings')
            .select('*');

        if (error) throw error;

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
