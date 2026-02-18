import { createServiceClient } from '@/lib/supabase';

export interface ClientItem {
    id: string;
    profile_id?: string | null;
    name: string;
    email: string;
    organization: string;
    created_at: string;
    last_login: string | null;
}

/**
 * Fetches all clients from the database
 */
export async function getClients(): Promise<ClientItem[]> {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }

    return data || [];
}
