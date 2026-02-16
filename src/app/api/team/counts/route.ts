import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET() {
    try {
        const serviceClient = createServiceClient();

        // 1. Fetch team members to map profile_id -> team_member_id
        const { data: teamMembers, error: teamError } = await serviceClient
            .from('team_members')
            .select('id, profile_id');

        if (teamError) throw teamError;

        // 2. Fetch all multi-assignments
        const { data: assignments, error: assignmentsError } = await serviceClient
            .from('request_assignments')
            .select('request_id, team_member_id');

        if (assignmentsError) throw assignmentsError;

        // 3. Fetch all primary Lead assignments
        const { data: leadRequests, error: leadError } = await serviceClient
            .from('requests')
            .select('id, assigned_to')
            .not('assigned_to', 'is', null);

        if (leadError) throw leadError;

        // Use a Set for each team member to store unique request IDs they are managing
        const memberRequests = new Map<string, Set<string>>();

        // Initialize sets for all members
        teamMembers?.forEach(tm => {
            memberRequests.set(tm.id, new Set());
        });

        // Add multi-assignments
        assignments?.forEach(a => {
            if (memberRequests.has(a.team_member_id)) {
                memberRequests.get(a.team_member_id)?.add(a.request_id);
            }
        });

        // Add Lead assignments (mapping profile_id back to team_member_id)
        leadRequests?.forEach(lr => {
            const member = teamMembers?.find(tm => tm.profile_id === lr.assigned_to);
            if (member) {
                memberRequests.get(member.id)?.add(lr.id);
            }
        });

        // Convert Map to simple count object
        const countMap: Record<string, number> = {};
        memberRequests.forEach((requests, memberId) => {
            countMap[memberId] = requests.size;
        });

        return NextResponse.json(countMap);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
