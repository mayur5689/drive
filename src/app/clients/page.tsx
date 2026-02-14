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
    Users,
    X,
    Eye,
    EyeOff
} from 'lucide-react';

interface ClientItem {
    id: string;
    name: string;
    email: string;
    organization: string;
    status: 'Active' | 'Invited';
    lastLogin: string;
    avatar?: string;
}

const mockClients: ClientItem[] = [
    { id: '1', name: 'Betty King', email: 'betty.king@example.com', organization: 'Novino Tech', status: 'Active', lastLogin: 'Feb 14, 2026, 04:06 PM' },
    { id: '2', name: 'James Rodriguez', email: 'james.rodriguez@example.com', organization: 'AneeVerse', status: 'Active', lastLogin: 'Feb 14, 2026, 03:56 PM' },
    { id: '3', name: 'Mary Williams', email: 'mary.williams@example.com', organization: 'AneeVerse', status: 'Active', lastLogin: 'Feb 14, 2026, 03:41 PM' },
    { id: '4', name: 'Nancy Hall', email: 'nancy.hall@example.com', organization: 'Global Solutions', status: 'Active', lastLogin: 'Feb 14, 2026, 03:26 PM' },
    { id: '5', name: 'Michael Martinez', email: 'michael.martinez@example.com', organization: 'Starlight Inc', status: 'Active', lastLogin: 'Feb 14, 2026, 03:11 PM' },
];

export default function ClientsPage() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('All Clients');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
                        <div className="bg-[#18181B] border border-shark rounded-2xl p-6 min-h-[calc(100vh-160px)] shadow-2xl">

                            {/* Toolbar */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="relative w-80">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-santas-gray" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search for Clients"
                                        className="w-full bg-[#09090B] border border-shark/50 rounded-lg py-2 pl-10 pr-4 text-xs text-iron placeholder:text-storm-gray focus:outline-none focus:border-[#279da6]/40 transition-all"
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
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#279da6] text-white text-xs font-bold hover:bg-[#279da6]/90 transition-all shadow-lg hover:shadow-[#279da6]/20"
                                    >
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
                                                <th className="px-6 py-4 border-r border-shark/60">User</th>
                                                <th className="px-6 py-4 border-r border-shark/60">Email</th>
                                                <th className="px-6 py-4 border-r border-shark/60">Organization</th>
                                                <th className="px-6 py-4 border-r border-shark/60">Status</th>
                                                <th className="px-6 py-4 border-r border-shark/60">Last Login</th>
                                                <th className="px-6 py-4 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-shark/60">
                                            {mockClients.map((client) => (
                                                <tr key={client.id} className="hover:bg-shark/10 transition-colors group text-xs font-medium">
                                                    <td className="px-5 py-4 border-r border-shark/60"><input type="checkbox" /></td>
                                                    <td className="px-6 py-4 border-r border-shark/60">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-shark/80 border border-white/5 overflow-hidden flex items-center justify-center text-[10px] text-white bg-gradient-to-br from-[#279da6]/20 to-transparent">
                                                                {client.name.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                            <span className="text-iron">{client.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-santas-gray border-r border-shark/60">{client.email}</td>
                                                    <td className="px-6 py-4 text-santas-gray border-r border-shark/60 font-bold">{client.organization}</td>
                                                    <td className="px-6 py-4 border-r border-shark/60">
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border bg-green-500/5 text-green-500 border-green-500/10">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                            {client.status}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-storm-gray border-r border-shark/60">{client.lastLogin}</td>
                                                    <td className="px-6 py-4 text-storm-gray text-center cursor-pointer hover:text-white">
                                                        <MoreHorizontal size={14} />
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

                {/* --- Create Client Modal --- */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
                            onClick={() => setIsModalOpen(false)}
                        />

                        {/* Modal Content */}
                        <div className="relative bg-[#18181B] border border-shark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up mx-4">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-shark">
                                <h3 className="text-lg font-bold text-iron">Client Information</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 text-santas-gray hover:text-white hover:bg-shark rounded-lg transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-santas-gray uppercase tracking-wider">
                                        Client Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full bg-[#09090B] border border-shark/60 rounded-xl py-2.5 px-4 text-sm text-iron focus:outline-none focus:border-[#279da6]/60 transition-all placeholder:text-storm-gray/50"
                                    />
                                </div>

                                {/* Organization */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-santas-gray uppercase tracking-wider">
                                        Company/Organization Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ACME Corporation"
                                        className="w-full bg-[#09090B] border border-shark/60 rounded-xl py-2.5 px-4 text-sm text-iron focus:outline-none focus:border-[#279da6]/60 transition-all placeholder:text-storm-gray/50"
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-santas-gray uppercase tracking-wider">
                                        Email Address <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="john@example.com"
                                        className="w-full bg-[#09090B] border border-shark/60 rounded-xl py-2.5 px-4 text-sm text-iron focus:outline-none focus:border-[#279da6]/60 transition-all placeholder:text-storm-gray/50"
                                    />
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-santas-gray uppercase tracking-wider">
                                        Password <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter password"
                                            className="w-full bg-[#09090B] border border-shark/60 rounded-xl py-2.5 px-4 text-sm text-iron focus:outline-none focus:border-[#279da6]/60 transition-all placeholder:text-storm-gray/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-storm-gray hover:text-iron transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-storm-gray font-medium">Minimum 6 characters</p>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-santas-gray uppercase tracking-wider">
                                        Confirm Password <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Confirm password"
                                        className="w-full bg-[#09090B] border border-shark/60 rounded-xl py-2.5 px-4 text-sm text-iron focus:outline-none focus:border-[#279da6]/60 transition-all placeholder:text-storm-gray/50"
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-[#121214] border-t border-shark flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 text-xs font-bold text-iron hover:bg-shark rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-6 py-2.5 text-xs font-bold bg-[#279da6] text-white rounded-xl shadow-lg shadow-[#279da6]/10 hover:shadow-[#279da6]/20 transition-all"
                                >
                                    Create Client Account
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
