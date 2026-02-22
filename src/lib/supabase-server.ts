import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a server-side Supabase client for use in Server Components, API routes, or Server Actions.
 */
export async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name, value, options) {
                    try {
                        cookieStore.set(name, value, options);
                    } catch (error) {
                        // Handle server action / middleware cookie setting constraints
                    }
                },
                remove(name, options) {
                    try {
                        cookieStore.set(name, '', { ...options, maxAge: 0 });
                    } catch (error) {
                        // Handle server action / middleware cookie setting constraints
                    }
                },
            },
        }
    );
}
