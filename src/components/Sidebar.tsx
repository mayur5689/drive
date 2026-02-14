'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    Calendar,
    Layers,
    Clock,
    Users as UsersIcon,
    UserCheck,
    Settings,
    Receipt,
    BarChart3,
    LogOut,
    Plus
} from 'lucide-react';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    href?: string;
    active?: boolean;
    isCollapsed?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, href = '#', active, isCollapsed }) => {
    const pathname = usePathname();
    const isActive = active !== undefined ? active : (href !== '#' && pathname === href);

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-all relative group ${isActive ? 'text-[#279da6]' : 'text-santas-gray hover:text-iron'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title={isCollapsed ? label : ''}
        >
            {isActive && (
                <div className={`absolute inset-0 bg-[#279da6]/10 rounded-md -z-10 ${isCollapsed ? 'mx-1' : ''}`} />
            )}
            <span className={`w-5 h-5 flex items-center justify-center shrink-0 ${isActive ? 'text-[#279da6]' : 'text-storm-gray'}`}>
                {icon}
            </span>
            {!isCollapsed && <span className="truncate transition-opacity duration-300">{label}</span>}
        </Link>
    );
};

interface SidebarProps {
    isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
    return (
        <aside className={`${isCollapsed ? 'w-16' : 'w-60'} bg-cod-gray border-r border-shark h-screen flex flex-col shrink-0 transition-all duration-300 ease-in-out font-sans`}>
            {/* Brand Logo & Name */}
            <div className="h-16 flex items-center px-5 shrink-0 overflow-hidden border-b border-shark/40">
                <div className={`flex items-center gap-3 w-full ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="relative w-10 h-10 shrink-0">
                        <Image
                            src="/images/Artboard 7@2x.png"
                            alt="Aneeverse Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    {!isCollapsed && (
                        <span className="text-2xl font-black tracking-tighter text-[#279da6] -mt-1 select-none">
                            aneeverse
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-6 space-y-6 overflow-x-hidden">
                {/* Dashboards Section */}
                <div>
                    {!isCollapsed && <div className="px-3 py-2 text-[10px] font-bold text-storm-gray uppercase tracking-widest opacity-50 mb-1">Dashboards</div>}
                    <nav className="space-y-1">
                        <NavItem icon={<LayoutDashboard size={18} />} label="Overview" href="/" isCollapsed={isCollapsed} />
                        <NavItem icon={<FileText size={18} />} label="Requests" href="/requests" isCollapsed={isCollapsed} />
                    </nav>
                </div>

                {/* Users Section (Moved Up) */}
                <div>
                    {!isCollapsed && <div className="px-3 py-2 text-[10px] font-bold text-storm-gray uppercase tracking-widest opacity-50 mb-1">Users</div>}
                    <nav className="space-y-1">
                        <NavItem icon={<UsersIcon size={18} />} label="Clients" href="/clients" isCollapsed={isCollapsed} />
                        <NavItem icon={<UserCheck size={18} />} label="Team" href="/team" isCollapsed={isCollapsed} />
                    </nav>
                </div>

                {/* Apps Section (Moved Down) */}
                <div>
                    {!isCollapsed && <div className="px-3 py-2 text-[10px] font-bold text-storm-gray uppercase tracking-widest opacity-50 mb-1">Apps</div>}
                    <nav className="space-y-1">
                        <NavItem icon={<Calendar size={18} />} label="Calendar" isCollapsed={isCollapsed} />
                        <NavItem icon={<Layers size={18} />} label="Widgets" isCollapsed={isCollapsed} />
                        <NavItem icon={<Clock size={18} />} label="Timeline" isCollapsed={isCollapsed} />
                    </nav>
                </div>

                {/* Management Section */}
                <div>
                    {!isCollapsed && <div className="px-3 py-2 text-[10px] font-bold text-storm-gray uppercase tracking-widest opacity-50 mb-1">Management</div>}
                    <nav className="space-y-1">
                        <NavItem icon={<Receipt size={18} />} label="Invoices" isCollapsed={isCollapsed} />
                        <NavItem icon={<BarChart3 size={18} />} label="Reports" isCollapsed={isCollapsed} />
                        <NavItem icon={<Settings size={18} />} label="Settings" isCollapsed={isCollapsed} />
                    </nav>
                </div>
            </div>

            {/* Footer Area - User Profile */}
            <div className="p-4 border-t border-shark shrink-0 bg-black/20">
                <button className={`flex items-center gap-3 p-2 hover:bg-shark rounded-xl transition-all w-full group ${isCollapsed ? 'justify-center p-1' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-shark overflow-hidden relative border border-white/10 shrink-0 shadow-lg">
                        <div className="w-full h-full bg-[#279da6]/20 flex items-center justify-center text-[10px] font-bold text-[#279da6] uppercase">
                            SC
                        </div>
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col items-start overflow-hidden">
                            <span className="text-xs font-bold text-iron truncate w-full">Sébastien Chopin</span>
                            <span className="text-[10px] text-storm-gray truncate w-full">Admin</span>
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
