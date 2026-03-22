import { NextRequest, NextResponse } from 'next/server';
import { getStorageItems, getStorageStats, searchFiles } from '@/lib/data/storage';

/**
 * GET: Get files/stats for a user.
 * Query: ?userId=<id>&action=stats|search&query=<term>
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const action = searchParams.get('action');

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        if (action === 'stats') {
            const stats = await getStorageStats(userId);
            return NextResponse.json(stats);
        }

        if (action === 'search') {
            const query = searchParams.get('query') || '';
            const results = await searchFiles(userId, query);
            return NextResponse.json(results);
        }

        const folderId = searchParams.get('folderId') || null;
        const items = await getStorageItems(userId, folderId);
        return NextResponse.json(items);
    } catch (error: any) {
        console.error('Files API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
