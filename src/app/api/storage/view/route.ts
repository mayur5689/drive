import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUrl } from '@/lib/r2';
import { getFileById } from '@/lib/data/storage';

/**
 * GET: Get a presigned URL for viewing/downloading a file.
 * Query params: ?fileId=<uuid> or ?key=<r2Key>
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const fileId = searchParams.get('fileId');
        const key = searchParams.get('key');

        let r2Key: string;

        if (fileId) {
            const file = await getFileById(fileId);
            if (!file) {
                return NextResponse.json({ error: 'File not found' }, { status: 404 });
            }
            r2Key = file.r2_key;
        } else if (key) {
            r2Key = key;
        } else {
            return NextResponse.json({ error: 'fileId or key required' }, { status: 400 });
        }

        const url = await getPresignedUrl(r2Key, 3600);
        return NextResponse.json({ url });
    } catch (error: any) {
        console.error('Storage view error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
