'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    Calendar,
    Layers,
    Clock,
    Users,
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
            className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-all relative group ${isActive ? 'text-malibu' : 'text-santas-gray hover:text-iron'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title={isCollapsed ? label : ''}
        >
            {isActive && (
                <div className={`absolute inset-0 bg-shark/40 rounded-md -z-10 ${isCollapsed ? 'mx-1' : ''}`} />
            )}
            <span className={`w-5 h-5 flex items-center justify-center shrink-0 ${isActive ? 'text-malibu' : 'text-storm-gray'}`}>
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
        <aside className={`${isCollapsed ? 'w-16' : 'w-60'} bg-cod-gray border-r border-shark h-screen flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden`}>
            {/* Header / Profile */}
            <div className="h-16 flex items-center px-4 shrink-0 overflow-hidden">
                <button className={`flex items-center gap-2 p-1.5 hover:bg-shark rounded-md transition-colors w-full group ${isCollapsed ? 'justify-center p-0' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-shark overflow-hidden relative border border-white/10 shrink-0">
                        <div className="w-full h-full bg-malibu/20 flex items-center justify-center text-[10px] font-bold text-malibu uppercase">
                            SC
                        </div>
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="text-sm font-semibold text-iron truncate w-full">Sébastien Chopin</span>
                                <span className="text-[10px] text-storm-gray truncate w-full">Administrator</span>
                            </div>
                            <div className="w-4 h-4 rounded-full bg-shark border border-white/10 flex items-center justify-center ml-auto">
                                <Plus size={10} className="text-storm-gray" />
                            </div>
                        </>
                    )}
                </button>
            </div>

            {/* Navigation Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-4 overflow-x-hidden">
                {/* Dashboards Section */}
                <div>
                    {!isCollapsed && <div className="px-3 py-2 text-[10px] font-bold text-storm-gray/80 uppercase tracking-tight">Dashboards</div>}
                    <nav className="space-y-0.5">
                        <NavItem icon={<LayoutDashboard size={18} />} label="Overview" href="/" isCollapsed={isCollapsed} />
                        <NavItem icon={<FileText size={18} />} label="Requests" href="/requests" isCollapsed={isCollapsed} />
                    </nav>
                </div>

                {/* Apps Section */}
                <div>
                    {!isCollapsed && <div className="px-3 py-2 text-[10px] font-bold text-storm-gray/80 uppercase tracking-tight">Apps</div>}
                    <nav className="space-y-0.5">
                        <NavItem icon={<Calendar size={18} />} label="Calendar" isCollapsed={isCollapsed} />
                        <NavItem icon={<Layers size={18} />} label="Widgets" isCollapsed={isCollapsed} />
                        <NavItem icon={<Clock size={18} />} label="Timeline" isCollapsed={isCollapsed} />
                    </nav>
                </div>

                {/* Users Section */}
                <div>
                    {!isCollapsed && <div className="px-3 py-2 text-[10px] font-bold text-storm-gray/80 uppercase tracking-tight">Users</div>}
                    <nav className="space-y-0.5">
                        <NavItem icon={<Users size={18} />} label="Clients" href="/clients" isCollapsed={isCollapsed} />
                        <NavItem icon={<UserCheck size={18} />} label="Team" href="/team" isCollapsed={isCollapsed} />
                    </nav>
                </div>

                {/* Settings Section */}
                <div>
                    {!isCollapsed && <div className="px-3 py-2 text-[10px] font-bold text-storm-gray/80 uppercase tracking-tight">Management</div>}
                    <nav className="space-y-0.5">
                        <NavItem icon={<Receipt size={18} />} label="Invoices" isCollapsed={isCollapsed} />
                        <NavItem icon={<BarChart3 size={18} />} label="Reports" isCollapsed={isCollapsed} />
                        <NavItem icon={<Settings size={18} />} label="Settings" isCollapsed={isCollapsed} />
                    </nav>
                </div>
            </div>

            {/* Footer Area */}
            <div className="p-4 space-y-4 shrink-0 overflow-hidden">
                {/* Logout */}
                <NavItem icon={<LogOut size={18} />} label="Logout" isCollapsed={isCollapsed} />
            </div>
        </aside>
    );
};

export default Sidebar;
