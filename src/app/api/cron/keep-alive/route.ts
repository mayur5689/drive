import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * Cron job to keep Supabase free-tier project alive.
 * Runs daily via Vercel Cron to prevent auto-pause.
 */
export async function GET(req: NextRequest) {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow if no CRON_SECRET is set (for easy setup)
        if (process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const supabase = createServiceClient();

        // Simple query to keep the database active
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        return NextResponse.json({
            ok: true,
            message: 'Supabase keep-alive ping successful',
            profiles: count,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Keep-alive error:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
