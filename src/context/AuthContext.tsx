'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
    id: string;
    email: string;
    role: 'super_admin' | 'admin' | 'client';
    full_name: string;
    avatar_url?: string;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    impersonatedProfile: Profile | null;
    isImpersonating: boolean;
    viewAsProfile: Profile | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    impersonate: (targetProfile: Profile) => void;
    stopImpersonating: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [impersonatedProfile, setImpersonatedProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load impersonation state from session storage if exists
        const stored = sessionStorage.getItem('impersonated_profile');
        if (stored) {
            try {
                setImpersonatedProfile(JSON.parse(stored));
            } catch (e) {
                sessionStorage.removeItem('impersonated_profile');
            }
        }

        // Check active sessions
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                setUser(session.user);
                await fetchProfile(session.user.id);
            }
            setIsLoading(false);
        };

        getSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                } else {
                    setUser(null);
                    setProfile(null);
                    setImpersonatedProfile(null);
                    sessionStorage.removeItem('impersonated_profile');
                }
                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error && data) {
            setProfile(data as Profile);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    const impersonate = (targetProfile: Profile) => {
        if (profile?.role === 'super_admin' || profile?.role === 'admin') {
            setImpersonatedProfile(targetProfile);
            sessionStorage.setItem('impersonated_profile', JSON.stringify(targetProfile));
        }
    };

    const stopImpersonating = () => {
        setImpersonatedProfile(null);
        sessionStorage.removeItem('impersonated_profile');
    };

    const isImpersonating = !!impersonatedProfile;
    const viewAsProfile = impersonatedProfile || profile;

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            impersonatedProfile,
            isImpersonating,
            viewAsProfile,
            isLoading,
            signOut,
            refreshProfile,
            impersonate,
            stopImpersonating
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
