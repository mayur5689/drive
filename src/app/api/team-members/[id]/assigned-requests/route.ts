import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * GET /api/team-members/[id]/assigned-requests
 * Returns request IDs where the request's assigned_to = this team member's profile_id.
 * This matches how the Requests page ASSIGNED column works.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        console.log('[assigned-requests] Team member ID received:', id);

        const supabase = createServiceClient();

        // 1. Get profile_id for this team member
        const { data: teamMember, error: tmError } = await supabase
            .from('team_members')
            .select('id, profile_id, name')
            .eq('id', id)
            .maybeSingle();

        console.log('[assigned-requests] Team member data:', JSON.stringify(teamMember));
        console.log('[assigned-requests] Team member error:', tmError);

        if (tmError) throw tmError;
        if (!teamMember) {
            console.log('[assigned-requests] No team member found for id:', id);
            return NextResponse.json([]);
        }

        if (!teamMember.profile_id) {
            console.log('[assigned-requests] Team member has no profile_id. Trying name-based match...');

            // Fallback: search requests by name match in the assignee profile (less reliable)
            // For now, return empty but log the issue
            console.log('[assigned-requests] Cannot find requests — team member profile_id is null.');
            return NextResponse.json([]);
        }

        console.log('[assigned-requests] Querying requests for profile_id:', teamMember.profile_id);

        // 2. Find all requests assigned to this profile
        const { data: assignedRequests, error: reqError } = await supabase
            .from('requests')
            .select('id, title')
            .eq('assigned_to', teamMember.profile_id);

        console.log('[assigned-requests] Assigned requests found:', JSON.stringify(assignedRequests));
        console.log('[assigned-requests] Error:', reqError);

        if (reqError) throw reqError;

        const requestIds = (assignedRequests || []).map(r => r.id);
        console.log('[assigned-requests] Returning request IDs:', requestIds);
        return NextResponse.json(requestIds);
    } catch (error: any) {
        console.error('[assigned-requests] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
