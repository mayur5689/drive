'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home,
    MessageSquare,
    Calendar,
    Box,
    Clock,
    Users,
    UserPlus,
    CreditCard,
    BarChart2,
    Settings,
    LogOut,
    MoreHorizontal,
    AlertTriangle,
    X,
    ChevronDown,
    ChevronUp,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarItemProps {
    item: {
        name: string;
        icon: any;
        path: string;
    };
    isActive: boolean;
    isCollapsed: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isActive, isCollapsed }) => {
    const Icon = item.icon;

    return (
        <Link
            href={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all relative group ${isActive ? 'text-[#279da6] bg-[#279da6]/5' : 'text-storm-gray hover:text-iron hover:bg-shark/20'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
        >
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#279da6] rounded-r-full shadow-[0_0_15px_rgba(39,157,166,0.5)]" />
            )}
            <span className={`flex items-center justify-center shrink-0 ${isActive ? 'text-[#279da6]' : 'text-storm-gray'}`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            </span>
            {!isCollapsed && <span className="truncate transition-opacity duration-300">{item.name}</span>}
        </Link>
    );
};

interface SidebarProps {
    isCollapsed: boolean;
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, signOut } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isUsersExpanded, setIsUsersExpanded] = useState(pathname.includes('/clients') || pathname.includes('/team'));

    const handleSignOut = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);

        try {
            // Attempt to sign out via Supabase with a 2-second timeout
            // We don't want to wait forever for a network request if the user wants to leave
            await Promise.race([
                signOut(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timeout')), 2000))
            ]);
        } catch (error) {
            console.error('Sign out took too long or failed, forcing local cleanup:', error);
        } finally {
            // ALWAYS clear storage and redirect, even if sign out fails or times out
            window.localStorage.clear();
            window.sessionStorage.clear();

            // Clear specific Supabase cookies as a fallback
            try {
                document.cookie.split(";").forEach((c) => {
                    document.cookie = c
                        .replace(/^ +/, "")
                        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
            } catch (err) {
                console.error('Cookie cleanup error:', err);
            }

            // Hard redirect to login to ensure fresh state
            window.location.replace('/login');
        }
    };

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';

    const menuItems = [
        { name: 'Overview', icon: Home, path: '/' },
        { name: 'Requests', icon: MessageSquare, path: '/requests' },
        // { name: 'Calendar', icon: Calendar, path: '/calendar', section: 'Apps', adminOnly: true },
        // { name: 'Widgets', icon: Box, path: '/widgets', section: 'Apps', adminOnly: true },
        // { name: 'Timeline', icon: Clock, path: '/timeline', section: 'Apps', adminOnly: true },
        { name: 'Clients', icon: Users, path: '/clients', section: 'Users', adminOnly: true },
        { name: 'Team', icon: UserPlus, path: '/team', section: 'Users', adminOnly: true },
        // { name: 'Invoices', icon: CreditCard, path: '/invoices', section: 'Management', adminOnly: true },
        // { name: 'Reports', icon: BarChart2, path: '/reports', section: 'Management', adminOnly: true },
        // { name: 'Settings', icon: Settings, path: '/settings', section: 'Management', adminOnly: true },
    ];

    // Filter items based on role
    const filteredItems = menuItems.filter(item => !item.adminOnly || isAdmin);

    const isUsersActive = pathname.includes('/clients') || pathname.includes('/team');

    return (
        <>
            <aside className={`flex flex-col bg-[#09090B] transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
                {/* Brand Header */}
                <div className={`${isCollapsed ? 'p-4 justify-center' : 'p-6 gap-3'} mb-2 flex items-center`}>
                    <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                            src="/images/Artboard 7@2x.png"
                            alt="Aneeverse Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col -mt-1">
                            <h1 className="text-xl font-black tracking-tighter text-[#279da6] select-none uppercase">aneeverse</h1>
                            <p className="text-[8px] text-storm-gray -mt-1 font-bold tracking-widest uppercase">Request hub</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-y-auto no-scrollbar scroll-smooth">
                    {/* Primary Items */}
                    {filteredItems.filter(item => !item.section).map((item) => (
                        <SidebarItem key={item.name} item={item} isCollapsed={isCollapsed} isActive={pathname === item.path} />
                    ))}

                    {/* Expandable Users Section */}
                    {isAdmin && (
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => setIsUsersExpanded(!isUsersExpanded)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all relative group ${isUsersActive ? 'text-[#279da6] bg-[#279da6]/5' : 'text-storm-gray hover:text-iron hover:bg-shark/20'
                                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                            >
                                {isUsersActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#279da6] rounded-r-full shadow-[0_0_15px_rgba(39,157,166,0.5)]" />
                                )}
                                <span className={`flex items-center justify-center shrink-0 ${isUsersActive ? 'text-[#279da6]' : 'text-storm-gray'}`}>
                                    <Users size={18} strokeWidth={isUsersActive ? 2.5 : 2} />
                                </span>
                                {!isCollapsed && (
                                    <>
                                        <span className="truncate flex-1 text-left">Users</span>
                                        {isUsersExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </>
                                )}
                            </button>

                            {!isCollapsed && isUsersExpanded && (
                                <div className="flex flex-col gap-1 ml-4 pl-4 border-l border-shark/40 mt-1 animate-fade-in">
                                    {filteredItems.filter(item => item.section === 'Users').map((item) => (
                                        <SidebarItem key={item.name} item={item} isCollapsed={isCollapsed} isActive={pathname === item.path} />
                                    ))}
                                </div>
                            )}

                            {isCollapsed && isUsersExpanded && (
                                <div className="flex flex-col gap-1 mt-1">
                                    {filteredItems.filter(item => item.section === 'Users').map((item) => (
                                        <SidebarItem key={item.name} item={item} isCollapsed={isCollapsed} isActive={pathname === item.path} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* User Footer */}
                <div className="p-4 border-t border-shark">
                    <div className={`bg-[#121214] border border-shark/40 p-3 rounded-2xl flex items-center justify-between gap-2 group/profile hover:border-[#279da6]/30 transition-all ${isCollapsed ? 'flex-col p-2' : ''}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-full bg-shark relative shrink-0 ring-2 ring-transparent group-hover/profile:ring-[#279da6]/20 transition-all overflow-hidden flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-[#279da6]/20 to-transparent">
                                {profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || profile?.email?.[0].toUpperCase() || 'U'}
                            </div>
                            {!isCollapsed && (
                                <div className="flex flex-col min-w-0">
                                    <p className="text-[11px] font-bold text-iron truncate leading-none mb-1">
                                        {profile?.full_name || 'User Account'}
                                    </p>
                                    <p className="text-[9px] text-storm-gray font-medium truncate uppercase tracking-tighter">
                                        {profile?.role?.replace('_', ' ') || 'Guest'}
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className={`p-2 hover:bg-rose-500/10 hover:text-rose-500 text-storm-gray rounded-xl transition-all ${isCollapsed ? 'mt-1 w-full flex justify-center' : ''}`}
                            title="Sign Out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#18181B] border border-shark rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-slide-up">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <AlertTriangle size={24} />
                            </div>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="text-storm-gray hover:text-iron transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <h2 className="text-xl font-bold text-iron mb-2">Sign out?</h2>
                        <p className="text-storm-gray text-sm mb-8 leading-relaxed">
                            Are you sure you want to sign out of your session? You'll need to login again to access your dashboard.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleSignOut}
                                disabled={isLoggingOut}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-rose-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : null}
                                {isLoggingOut ? 'Signing out...' : 'Yes, Sign Out'}
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                disabled={isLoggingOut}
                                className="w-full bg-shark/50 hover:bg-shark text-iron py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
