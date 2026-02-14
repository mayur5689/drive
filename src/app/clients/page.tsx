'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
    Search,
    Download,
    Plus,
    Filter,
    Calendar as CalendarIcon,
    MoreHorizontal,
    ArrowUpDown,
    ChevronDown,
    ChevronRight,
    Users
} from 'lucide-react';

interface ClientItem {
    id: string;
    name: string;
    email: string;
    role: 'Member' | 'Owner' | 'Admin';
    status: 'Active' | 'Invited';
    lastLogin: string;
    avatar?: string;
}

const mockClients: ClientItem[] = [
    { id: '1', name: 'Betty King', email: 'betty.king@example.com', role: 'Member', status: 'Active', lastLogin: 'Feb 14, 2026, 04:06 PM' },
    { id: '2', name: 'James Rodriguez', email: 'james.rodriguez@example.com', role: 'Owner', status: 'Active', lastLogin: 'Feb 14, 2026, 03:56 PM' },
    { id: '3', name: 'Mary Williams', email: 'mary.williams@example.com', role: 'Owner', status: 'Active', lastLogin: 'Feb 14, 2026, 03:41 PM' },
    { id: '4', name: 'Nancy Hall', email: 'nancy.hall@example.com', role: 'Member', status: 'Active', lastLogin: 'Feb 14, 2026, 03:26 PM' },
    { id: '5', name: 'Michael Martinez', email: 'michael.martinez@example.com', role: 'Admin', status: 'Active', lastLogin: 'Feb 14, 2026, 03:11 PM' },
    { id: '6', name: 'John Doe', email: 'john.doe@example.com', role: 'Admin', status: 'Active', lastLogin: 'Feb 14, 2026, 02:11 PM' },
    { id: '7', name: 'Chris Wilson', email: 'chris.wilson@example.com', role: 'Member', status: 'Active', lastLogin: 'Feb 14, 2026, 11:11 AM' },
    { id: '8', name: 'Karen Clark', email: 'karen.clark@example.com', role: 'Member', status: 'Active', lastLogin: 'Feb 14, 2026, 04:11 AM' },
    { id: '9', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Member', status: 'Active', lastLogin: 'Feb 13, 2026, 04:11 AM' },
    { id: '10', name: 'Linda White', email: 'linda.white@example.com', role: 'Member', status: 'Invited', lastLogin: 'Feb 13, 2026, 04:11 AM' },
];

export default function ClientsPage() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('All Clients');

    const clientCategories = ['All Clients', 'Leads', 'Ongoing', 'Closed', 'Archived'];

    return (
        <div className="flex h-screen bg-[#09090B] text-iron font-sans overflow-hidden">
            <Sidebar isCollapsed={isSidebarCollapsed} />

            <div className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative">
                <Header
                    onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    label="Clients"
                    labelIcon={<Users size={16} className="text-santas-gray" />}
                    tabs={clientCategories}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />

                <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#121214]">
                    <div className="p-6">
                        {/* Consistent Content Wrapper */}
                        <div className="bg-[#18181B] border border-shark rounded-2xl p-6 min-h-[calc(100vh-160px)] shadow-2xl">

                            {/* Toolbar */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="relative w-80">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-santas-gray" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search for Clients"
                                        className="w-full bg-[#09090B] border border-shark/50 rounded-lg py-2 pl-10 pr-4 text-xs text-iron placeholder:text-storm-gray focus:outline-none focus:border-[#7C86FF]/40 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-shark bg-shark/20 text-[11px] font-bold text-santas-gray hover:text-white transition-all">
                                        <CalendarIcon size={14} className="text-storm-gray" />
                                        <span>14-2-2026</span>
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-shark bg-shark/20 text-[11px] font-bold text-santas-gray hover:text-white transition-all">
                                        <Filter size={14} />
                                        <span>Filters</span>
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-white/90 transition-all">
                                        <Plus size={14} />
                                        <span>Add New</span>
                                    </button>
                                </div>
                            </div>

                            {/* Clients Table */}
                            <div className="border border-shark/60 rounded-xl overflow-hidden bg-black/20">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse table-auto">
                                        <thead>
                                            <tr className="border-b border-shark text-storm-gray text-[10px] uppercase font-bold bg-shark/20">
                                                <th className="px-5 py-4 w-10 border-r border-shark/60"><input type="checkbox" /></th>
                                                <th className="px-6 py-4 border-r border-shark/60">
                                                    <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                                                        User <ArrowUpDown size={12} />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 border-r border-shark/60">
                                                    <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                                                        Email <ArrowUpDown size={12} />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 border-r border-shark/60">
                                                    <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                                                        Role <ArrowUpDown size={12} />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 border-r border-shark/60">
                                                    <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                                                        Status <ArrowUpDown size={12} />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 border-r border-shark/60">
                                                    <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                                                        Last Login <ArrowUpDown size={12} />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-shark/60">
                                            {mockClients.map((client) => (
                                                <tr key={client.id} className="hover:bg-shark/10 transition-colors group cursor-pointer text-xs font-medium">
                                                    <td className="px-5 py-4 border-r border-shark/60"><input type="checkbox" /></td>
                                                    <td className="px-6 py-4 border-r border-shark/60">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-shark/80 border border-white/5 overflow-hidden flex items-center justify-center text-[10px] text-white bg-gradient-to-br from-[#7C86FF]/20 to-transparent">
                                                                {client.name.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                            <span className="text-iron group-hover:text-white transition-colors">{client.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-santas-gray border-r border-shark/60">{client.email}</td>
                                                    <td className="px-6 py-4 text-santas-gray border-r border-shark/60 text-[11px] font-bold uppercase tracking-wider">{client.role}</td>
                                                    <td className="px-6 py-4 border-r border-shark/60">
                                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${client.status === 'Active'
                                                                ? 'bg-green-500/5 text-green-500 border-green-500/10'
                                                                : 'bg-yellow-500/5 text-yellow-500 border-yellow-500/10'
                                                            }`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${client.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                            {client.status}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-storm-gray border-r border-shark/60 text-[11px]">{client.lastLogin}</td>
                                                    <td className="px-6 py-4 text-storm-gray text-center">
                                                        <MoreHorizontal size={14} className="cursor-pointer hover:text-white mx-auto" />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
