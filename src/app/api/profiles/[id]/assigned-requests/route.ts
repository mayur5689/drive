import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createServiceClient();

        // 1. Get team member ID for this profile
        const { data: teamMember, error: tmError } = await supabase
            .from('team_members')
            .select('id')
            .eq('profile_id', id)
            .maybeSingle();

        if (tmError) throw tmError;
        if (!teamMember) return NextResponse.json([]);

        // 2. Get assigned requests for this team member
        const { data: assignments, error: assignError } = await supabase
            .from('request_assignments')
            .select('request_id')
            .eq('team_member_id', teamMember.id);

        if (assignError) throw assignError;

        const requestIds = (assignments || []).map(a => a.request_id);
        return NextResponse.json(requestIds);
    } catch (error: any) {
        console.error('Error fetching assigned requests:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
