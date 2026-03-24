'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
    Cloud,
    FolderOpen,
    Star,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Loader2,
    X,
    AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AccountModal from '@/components/AccountModal';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

const navItems = [
    { name: 'My Files', icon: FolderOpen, path: '/files' },
    { name: 'Starred', icon: Star, path: '/files?view=starred' },
];

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view');
    const { profile, signOut, isLoading } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleSignOut = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await Promise.race([
                signOut(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
            ]);
        } catch { }
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.location.href = '/login';
    };

    const initials = profile?.full_name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U';

    return (
        <>
            <aside className={`flex flex-col bg-[#0a0a0a] border-r border-[#1e1e1e] transition-all duration-300 ${isCollapsed ? 'w-[68px]' : 'w-[240px]'}`}>
                {/* Brand */}
                <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-5'} border-b border-[#1e1e1e]`}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center shrink-0">
                        <Cloud size={16} className="text-white" />
                    </div>
                    {!isCollapsed && (
                        <div className="ml-3 min-w-0">
                            <h1 className="text-sm font-bold text-white tracking-tight truncate">AI Cloud Storage</h1>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = item.path === '/files'
                            ? pathname === '/files' && !currentView
                            : pathname === '/files' && currentView === item.path.split('view=')[1];
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? 'bg-[#6366f1]/10 text-[#818cf8]'
                                    : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#111]'
                                    } ${isCollapsed ? 'justify-center px-2' : ''}`}
                            >
                                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                                {!isCollapsed && <span>{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse toggle */}
                <div className="px-3 pb-2">
                    <button
                        onClick={onToggle}
                        className="w-full flex items-center justify-center p-2 rounded-lg text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#111] transition-all"
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                {/* User */}
                <div className="p-3 border-t border-[#1e1e1e]">
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <button
                            onClick={() => setShowAccountModal(true)}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1]/30 to-[#06b6d4]/20 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-[#1e1e1e] hover:border-[#6366f1]/40 transition-all"
                            title="Account settings"
                        >
                            {isLoading ? <Loader2 size={14} className="animate-spin text-[#6366f1]" /> : initials}
                        </button>
                        {!isCollapsed && (
                            <>
                                <button
                                    onClick={() => setShowAccountModal(true)}
                                    className="flex-1 min-w-0 text-left hover:opacity-80 transition-all"
                                >
                                    <p className="text-sm font-medium text-white truncate">
                                        {profile?.full_name || 'User'}
                                    </p>
                                    <p className="text-xs text-[#71717a] truncate">
                                        {profile?.email}
                                    </p>
                                </button>
                                <button
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="p-1.5 rounded-lg text-[#71717a] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
                                    title="Sign out"
                                >
                                    <LogOut size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* Account Modal */}
            <AccountModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} />

            {/* Logout modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#ef4444]/10 flex items-center justify-center text-[#ef4444]">
                                <AlertTriangle size={20} />
                            </div>
                            <button onClick={() => setShowLogoutConfirm(false)} className="text-[#71717a] hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <h2 className="text-lg font-semibold text-white mb-1">Sign out?</h2>
                        <p className="text-[#71717a] text-sm mb-6">You&apos;ll need to login again to access your files.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                disabled={isLoggingOut}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-[#111] border border-[#1e1e1e] text-white text-sm font-medium hover:bg-[#181818] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSignOut}
                                disabled={isLoggingOut}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-[#ef4444] text-white text-sm font-medium hover:bg-[#dc2626] transition-all flex items-center justify-center gap-2"
                            >
                                {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : 'Sign Out'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
