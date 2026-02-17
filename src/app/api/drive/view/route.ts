import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getFile } from '@/lib/googleDrive';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fileId = searchParams.get('fileId');

        if (!fileId) {
            return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
        }

        // 1. Check Authentication
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch file from Google Drive
        const { stream, mimeType, name } = await getFile(fileId);

        // 3. Return as stream
        return new Response(stream, {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `inline; filename="${name}"`,
            },
        });
    } catch (error: any) {
        console.error('Drive View Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
