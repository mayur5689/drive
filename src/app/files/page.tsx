import { getUserFilesData } from '@/lib/data/files';
import FilesClient from '@/components/FilesClient';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

// Force SSR
export const dynamic = 'force-dynamic';

export default async function FilesPage() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch user-specific drive content
    const { rootId, items } = await getUserFilesData(user.id, user.email || '');

    return (
        <FilesClient
            initialRootId={rootId}
            initialDriveItems={items}
            initialDbEnrichment={{ clients: [], requests: [] }}
        />
    );
}
