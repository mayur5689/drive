'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
    ArrowLeft,
    Mail,
    Building,
    Calendar,
    Clock,
    Shield,
    MessageSquare,
    CreditCard,
    Settings as SettingsIcon,
    LayoutGrid,
    Loader2,
    ChevronRight,
    Search,
    Filter,
    Download
} from 'lucide-react';

interface Client {
    id: string;
    name: string;
    email: string;
    organization: string;
    status: string;
    created_at: string;
}

export default function ClientDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('Overview');
    const [client, setClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const tabs = ['Overview', 'Requests', 'Invoices', 'Settings'];

    useEffect(() => {
        const fetchClient = async () => {
            try {
                // In a real app, this would be an API call to fetch by ID
                const response = await fetch('/api/clients');
                const allClients = await response.json();
                const foundClient = allClients.find((c: any) => c.id === id);

                if (foundClient) {
                    setClient(foundClient);
                }
            } catch (error) {
                console.error('Failed to fetch client details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchClient();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex h-screen bg-[#09090B] items-center justify-center">
                <Loader2 size={32} className="text-[#279da6] animate-spin" />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex flex-col h-screen bg-[#09090B] items-center justify-center text-iron">
                <p className="text-xl font-bold mb-4">Client not found</p>
                <button
                    onClick={() => router.push('/clients')}
                    className="flex items-center gap-2 text-[#279da6] font-bold hover:underline"
                >
                    <ArrowLeft size={16} />
                    Back to Clients
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#09090B] text-iron font-sans overflow-hidden">
            <Sidebar isCollapsed={isSidebarCollapsed} />

            <div className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative">
                {/* Custom Breadcrumb Header (Replacing standard Header for detail view) */}
                <div className="h-20 border-b border-[#1C1C1F] bg-[#09090B] flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsSidebarCollapsed(!isSidebarCollapsed); }}
                            className="p-2 -ml-2 text-storm-gray hover:bg-shark/20 rounded-xl transition-all"
                        >
                            <LayoutGrid size={20} />
                        </button>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-[0.2em] text-storm-gray mb-1">
                                <button onClick={() => router.push('/clients')} className="hover:text-iron transition-colors">Clients</button>
                                <ChevronRight size={10} className="opacity-40" />
                                <span className="text-[#279da6]">Client Details</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-black text-iron tracking-tight uppercase leading-none">{client.name}</h1>
                                <div className="px-2 py-0.5 rounded bg-[#279da6]/10 border border-[#279da6]/20 text-[9px] font-black text-[#279da6] uppercase tracking-tighter">
                                    {client.status}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-black/40 border border-shark p-1 rounded-xl shrink-0">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#1E1E22] text-[#279da6] border border-[#279da6]/20 shadow-lg' : 'text-storm-gray hover:text-iron hover:bg-white/5'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="h-4 w-[1px] bg-shark ml-2" />
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#279da6] text-white text-xs font-bold hover:bg-[#279da6]/90 transition-all shadow-lg shadow-[#279da6]/20">
                            <SettingsIcon size={14} />
                            <span>Edit Profile</span>
                        </button>
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#121214]">
                    <div className="p-8">
                        {activeTab === 'Overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                                {/* Info Cards */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-[#18181B] border border-shark rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                            <Building size={120} />
                                        </div>
                                        <h3 className="text-xs font-black text-storm-gray uppercase tracking-[0.3em] mb-8">Professional Profile</h3>

                                        <div className="grid grid-cols-2 gap-y-10">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-bold text-storm-gray uppercase tracking-widest flex items-center gap-2">
                                                    <Mail size={12} className="text-[#279da6]" /> Email Address
                                                </p>
                                                <p className="text-iron font-bold text-sm tracking-tight">{client.email}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-bold text-storm-gray uppercase tracking-widest flex items-center gap-2">
                                                    <Building size={12} className="text-[#279da6]" /> Organization
                                                </p>
                                                <p className="text-iron font-bold text-sm tracking-tight uppercase">{client.organization}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-bold text-storm-gray uppercase tracking-widest flex items-center gap-2">
                                                    <Calendar size={12} className="text-[#279da6]" /> Joined Date
                                                </p>
                                                <p className="text-iron font-bold text-sm tracking-tight">
                                                    {new Date(client.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-bold text-storm-gray uppercase tracking-widest flex items-center gap-2">
                                                    <Shield size={12} className="text-[#279da6]" /> Account Level
                                                </p>
                                                <p className="text-iron font-bold text-sm tracking-tight">Premium Enterprise</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-[#18181B] border border-shark rounded-3xl p-6 flex items-center justify-between group hover:border-[#279da6]/20 transition-all">
                                            <div>
                                                <p className="text-[9px] font-black text-storm-gray uppercase tracking-[0.3em] mb-1">Total Requests</p>
                                                <p className="text-2xl font-black text-white">24</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-[#279da6]/10 flex items-center justify-center text-[#279da6] group-hover:scale-110 transition-transform">
                                                <MessageSquare size={20} />
                                            </div>
                                        </div>
                                        <div className="bg-[#18181B] border border-shark rounded-3xl p-6 flex items-center justify-between group hover:border-[#279da6]/20 transition-all">
                                            <div>
                                                <p className="text-[9px] font-black text-storm-gray uppercase tracking-[0.3em] mb-1">Active Invoices</p>
                                                <p className="text-2xl font-black text-white">$12,450</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-[#279da6]/10 flex items-center justify-center text-[#279da6] group-hover:scale-110 transition-transform">
                                                <CreditCard size={20} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Column */}
                                <div className="space-y-8">
                                    <div className="bg-[#18181B] border border-shark rounded-3xl p-8">
                                        <h3 className="text-[10px] font-black text-storm-gray uppercase tracking-[0.3em] mb-6">Actions</h3>
                                        <div className="flex flex-col gap-3">
                                            <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-shark/20 border border-shark hover:bg-shark text-iron font-bold text-xs transition-all group">
                                                Edit Profile <SettingsIcon size={14} className="text-storm-gray group-hover:text-[#279da6] transition-colors" />
                                            </button>
                                            <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-shark/20 border border-shark hover:bg-shark text-iron font-bold text-xs transition-all group">
                                                Message Client <MessageSquare size={14} className="text-storm-gray group-hover:text-[#279da6] transition-colors" />
                                            </button>
                                            <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#279da6]/5 border border-[#279da6]/20 hover:bg-[#279da6]/10 text-[#279da6] font-bold text-xs transition-all">
                                                Create Invoice <CreditCard size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Requests' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-black text-iron tracking-tight uppercase">Recent Requests</h2>
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-storm-gray" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search requests..."
                                                className="w-full bg-[#09090B] border border-shark/50 rounded-lg py-1.5 pl-9 pr-4 text-[11px] text-iron focus:outline-none focus:border-[#279da6]/40 transition-all font-bold"
                                            />
                                        </div>
                                        <button className="p-2 bg-shark/20 border border-shark rounded-lg text-storm-gray hover:text-white transition-all"><Filter size={14} /></button>
                                        <button className="p-2 bg-shark/20 border border-shark rounded-lg text-storm-gray hover:text-white transition-all"><Download size={14} /></button>
                                    </div>
                                </div>

                                <div className="bg-[#18181B] border border-shark rounded-3xl overflow-hidden min-h-[400px] flex items-center justify-center text-storm-gray uppercase text-[10px] font-black tracking-widest opacity-40">
                                    No requests found for this client.
                                </div>
                            </div>
                        )}

                        {(activeTab === 'Invoices' || activeTab === 'Settings') && (
                            <div className="bg-[#18181B] border border-shark rounded-3xl overflow-hidden min-h-[400px] flex items-center justify-center text-storm-gray uppercase text-[10px] font-black tracking-widest opacity-40 animate-fade-in">
                                {activeTab} module coming soon.
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
