'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutGrid,
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
    MoreHorizontal
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
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all relative group ${isActive ? 'text-[#279da6] bg-[#279da6]/5' : 'text-storm-gray hover:text-iron hover:bg-shark/20'
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

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    const menuItems = [
        { name: 'Overview', icon: LayoutGrid, path: '/' },
        { name: 'Requests', icon: MessageSquare, path: '/requests' },
        { name: 'Calendar', icon: Calendar, path: '/calendar', section: 'Apps' },
        { name: 'Widgets', icon: Box, path: '/widgets', section: 'Apps' },
        { name: 'Timeline', icon: Clock, path: '/timeline', section: 'Apps' },
        { name: 'Clients', icon: Users, path: '/clients', section: 'Users' },
        { name: 'Team', icon: UserPlus, path: '/team', section: 'Users' },
        { name: 'Invoices', icon: CreditCard, path: '/invoices', section: 'Management' },
        { name: 'Reports', icon: BarChart2, path: '/reports', section: 'Management' },
        { name: 'Settings', icon: Settings, path: '/settings', section: 'Management' },
    ];

    return (
        <aside className={`flex flex-col bg-[#09090B] border-r border-[#1C1C1F] transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
            {/* Brand Header */}
            <div className="p-6 mb-2 flex items-center gap-3">
                <div className="relative w-8 h-8 flex-shrink-0">
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
            <div className="flex-1 px-4 py-2 flex flex-col gap-8 overflow-y-auto no-scrollbar scroll-smooth">
                {/* Dashboards Section */}
                <div>
                    {!isCollapsed && (
                        <h3 className="text-[10px] font-black text-storm-gray uppercase tracking-[0.2em] mb-4 px-3 opacity-50">
                            Dashboards
                        </h3>
                    )}
                    <nav className="flex flex-col gap-1">
                        {menuItems.filter(item => !item.section).map((item) => (
                            <SidebarItem key={item.name} item={item} isCollapsed={isCollapsed} isActive={pathname === item.path} />
                        ))}
                    </nav>
                </div>

                {/* Users Section */}
                <div>
                    {!isCollapsed && (
                        <h3 className="text-[10px] font-black text-storm-gray uppercase tracking-[0.2em] mb-4 px-3 opacity-50">
                            Users
                        </h3>
                    )}
                    <nav className="flex flex-col gap-1">
                        {menuItems.filter(item => item.section === 'Users').map((item) => (
                            <SidebarItem key={item.name} item={item} isCollapsed={isCollapsed} isActive={pathname === item.path} />
                        ))}
                    </nav>
                </div>

                {/* Apps Section */}
                <div>
                    {!isCollapsed && (
                        <h3 className="text-[10px] font-black text-storm-gray uppercase tracking-[0.2em] mb-4 px-3 opacity-50">
                            Apps
                        </h3>
                    )}
                    <nav className="flex flex-col gap-1">
                        {menuItems.filter(item => item.section === 'Apps').map((item) => (
                            <SidebarItem key={item.name} item={item} isCollapsed={isCollapsed} isActive={pathname === item.path} />
                        ))}
                    </nav>
                </div>

                {/* Management Section */}
                <div>
                    {!isCollapsed && (
                        <h3 className="text-[10px] font-black text-storm-gray uppercase tracking-[0.2em] mb-4 px-3 opacity-50">
                            Management
                        </h3>
                    )}
                    <nav className="flex flex-col gap-1">
                        {menuItems.filter(item => item.section === 'Management').map((item) => (
                            <SidebarItem key={item.name} item={item} isCollapsed={isCollapsed} isActive={pathname === item.path} />
                        ))}
                    </nav>
                </div>
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
                        onClick={() => handleSignOut()}
                        className={`p-2 hover:bg-rose-500/10 hover:text-rose-500 text-storm-gray rounded-xl transition-all ${isCollapsed ? 'mt-1 w-full flex justify-center' : ''}`}
                        title="Sign Out"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
