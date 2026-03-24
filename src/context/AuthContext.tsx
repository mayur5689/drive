'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface Profile {
    id: string;
    email: string;
    full_name: string;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                await fetchProfile(session.user);
            }
            setIsLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setProfile(null);
                    setUser(null);
                } else if (session) {
                    setUser(session.user);
                    await fetchProfile(session.user);
                }
                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (u: User) => {
        // Try DB profile first
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', u.id)
            .single();

        if (!error && data) {
            setProfile({
                id: data.id,
                email: u.email || '',
                full_name: data.full_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
            });
        } else {
            // Fallback from auth metadata
            setProfile({
                id: u.id,
                email: u.email || '',
                full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
            });
        }
    };

    const signOut = async () => {
        setProfile(null);
        setUser(null);
        await supabase.auth.signOut();
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user);
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            isLoading,
            signOut,
            refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
