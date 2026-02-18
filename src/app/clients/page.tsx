import { getClients } from '@/lib/data/clients';
import ClientsClient from '@/components/ClientsClient';

// Force SSR
export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
    // Fetch clients data on the server
    const clientsData = await getClients();

    // Map to UI format
    const mappedClients = clientsData.map((c: any) => ({
        id: c.id,
        profile_id: c.profile_id,
        name: c.name,
        email: c.email,
        organization: c.organization,
        createdAt: new Date(c.created_at).toLocaleDateString(),
        lastLogin: c.last_login ? new Date(c.last_login).toLocaleString() : 'Never'
    }));

    return <ClientsClient initialClients={mappedClients} />;
}
