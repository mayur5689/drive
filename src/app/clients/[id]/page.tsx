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
    Download,
    PanelLeft,
    Users,
    Eye,
    EyeOff
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

    // Settings Form State
    const [settingsEmail, setSettingsEmail] = useState('');
    const [settingsPassword, setSettingsPassword] = useState('');
    const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showSettingsPassword, setShowSettingsPassword] = useState(false);

    useEffect(() => {
        if (client) {
            setSettingsEmail(client.email);
        }
    }, [client]);

    const handleSettingsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!client) return;

        if (settingsPassword && settingsPassword !== settingsConfirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        setIsUpdating(true);
        try {
            const response = await fetch('/api/clients', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: client.id,
                    email: settingsEmail !== client.email ? settingsEmail : undefined,
                    password: settingsPassword || undefined,
                    oldEmail: client.email // Help find the auth user if email changes
                })
            });

            if (response.ok) {
                alert("Settings updated successfully!");
                setSettingsPassword('');
                setSettingsConfirmPassword('');
                // Refresh client data
                const updatedClient = { ...client, email: settingsEmail };
                setClient(updatedClient);
            } else {
                const err = await response.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error('Update failed:', error);
            alert("Failed to update settings.");
        } finally {
            setIsUpdating(false);
        }
    };

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
                <div className="flex-1 flex flex-col min-w-0 bg-[#121214] rounded-t-2xl overflow-hidden border-t border-l border-r border-shark mt-6 mr-6">
                    {/* Custom Breadcrumb Header (Replacing standard Header for detail view) */}
                    <div className="h-16 flex items-center justify-between px-6 shrink-0 z-30">
                        <div className="flex items-center gap-4 flex-1 overflow-hidden">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsSidebarCollapsed(!isSidebarCollapsed); }}
                                className="p-1 text-santas-gray hover:text-white transition-colors"
                            >
                                <PanelLeft size={18} />
                            </button>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-shark/40 border border-shark rounded-lg shrink-0">
                                    <Users size={16} className="text-[#279da6]" />
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight">
                                        <span className="text-iron">{client.name}</span>
                                        <div className="w-1 h-1 rounded-full bg-shark" />
                                        <span className="text-[#279da6] text-[10px]">{client.status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sub-Navigation Tabs */}
                            <div className="flex items-center bg-black/40 border border-shark p-1 rounded-xl shrink-0 ml-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${activeTab === tab
                                            ? 'bg-[#1E1E22] text-[#279da6] border border-[#279da6]/20 shadow-lg'
                                            : 'text-santas-gray hover:text-iron hover:bg-white/5'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-santas-gray hover:text-white transition-colors group">
                                <SettingsIcon size={16} className="group-hover:text-white" />
                                <span>edit</span>
                            </button>
                            <div className="h-4 w-[1px] bg-shark" />
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#279da6] text-white text-xs font-bold hover:bg-[#279da6]/90 transition-all shadow-lg hover:shadow-[#279da6]/20">
                                <CreditCard size={14} />
                                <span>Invoice</span>
                            </button>
                        </div>
                    </div>

                    <main className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="px-8 pb-8 pt-0">
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

                            {activeTab === 'Invoices' && (
                                <div className="bg-[#18181B] border border-shark rounded-3xl overflow-hidden min-h-[400px] flex items-center justify-center text-storm-gray uppercase text-[10px] font-black tracking-widest opacity-40 animate-fade-in">
                                    Invoices module coming soon.
                                </div>
                            )}

                            {activeTab === 'Settings' && (
                                <div className="max-w-2xl animate-fade-in">
                                    <div className="bg-[#18181B] border border-shark rounded-3xl p-8 shadow-2xl">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 rounded-2xl bg-[#279da6]/10 flex items-center justify-center text-[#279da6]">
                                                <Shield size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-iron tracking-tight uppercase">Account Security</h2>
                                                <p className="text-xs font-bold text-santas-gray uppercase tracking-widest">Update credentials for {client.name}</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleSettingsSubmit} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-storm-gray uppercase tracking-[0.2em]">Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#279da6]" size={16} />
                                                    <input
                                                        type="email"
                                                        value={settingsEmail}
                                                        onChange={(e) => setSettingsEmail(e.target.value)}
                                                        className="w-full bg-[#09090B] border border-shark/60 rounded-2xl py-3 pl-12 pr-4 text-sm text-iron focus:outline-none focus:border-[#279da6]/60 transition-all font-bold"
                                                        placeholder="client@example.com"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-storm-gray uppercase tracking-[0.2em]">New Password</label>
                                                    <div className="relative">
                                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#279da6]" size={16} />
                                                        <input
                                                            type={showSettingsPassword ? "text" : "password"}
                                                            value={settingsPassword}
                                                            onChange={(e) => setSettingsPassword(e.target.value)}
                                                            className="w-full bg-[#09090B] border border-shark/60 rounded-2xl py-3 pl-12 pr-12 text-sm text-iron focus:outline-none focus:border-[#279da6]/60 transition-all font-bold"
                                                            placeholder="••••••••"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowSettingsPassword(!showSettingsPassword)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-storm-gray hover:text-iron transition-colors"
                                                        >
                                                            {showSettingsPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-storm-gray uppercase tracking-[0.2em]">Confirm Password</label>
                                                    <div className="relative">
                                                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#279da6]" size={16} />
                                                        <input
                                                            type={showSettingsPassword ? "text" : "password"}
                                                            value={settingsConfirmPassword}
                                                            onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                                                            className="w-full bg-[#09090B] border border-shark/60 rounded-2xl py-3 pl-12 pr-4 text-sm text-iron focus:outline-none focus:border-[#279da6]/60 transition-all font-bold"
                                                            placeholder="••••••••"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 flex items-center justify-between">
                                                <p className="text-[10px] text-storm-gray font-bold max-w-[280px] leading-relaxed uppercase tracking-tighter">
                                                    Changing these settings will update the client's login credentials immediately.
                                                </p>
                                                <button
                                                    type="submit"
                                                    disabled={isUpdating}
                                                    className="px-8 py-3 bg-[#279da6] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#279da6]/90 transition-all shadow-lg shadow-[#279da6]/20 disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {isUpdating ? <Loader2 size={14} className="animate-spin" /> : null}
                                                    {isUpdating ? 'Updating...' : 'Save Changes'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
