'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
    Search,
    Download,
    Plus,
    Calendar as CalendarIcon,
    ArrowUpDown,
    ChevronDown,
    ListFilter,
    Upload,
    AlertCircle,
    MessageSquare as ChatIcon,
    Loader2,
    Plus as PlusIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ChatDrawer from '@/components/ChatDrawer';
import CreateRequestModal from '@/components/CreateRequestModal';

interface RequestItem {
    id: string;
    title: string;
    description: string;
    client: { full_name: string; email: string } | null;
    status: string;
    priority: string;
    assigned_to: string | null;
    assignee: { id: string; full_name: string } | null;
    due_date: string;
    created_at: string;
    updated_at: string;
}

interface Profile {
    id: string;
    full_name: string;
    email: string;
}

export default function RequestsPage() {
    const router = useRouter();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('All');
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const dateInputRefs = React.useRef<{ [key: string]: HTMLInputElement | null }>({});

    const subTabs = ['All', 'Assigned', 'Open', 'Unassigned', 'Completed'];

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const [reqRes, profRes] = await Promise.all([
                fetch('/api/requests'),
                fetch('/api/profiles')
            ]);

            if (reqRes.ok) {
                const data = await reqRes.json();
                setRequests(data);
            }

            if (profRes.ok) {
                const data = await profRes.json();
                setProfiles(data);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleOpenChat = (request: RequestItem) => {
        setSelectedRequest(request);
        setIsChatOpen(true);
    };

    const handleUpdateField = async (requestId: string, field: string, value: any) => {
        const originalRequests = [...requests];

        // Optimistic UI update
        const updatedRequests = requests.map(req => {
            if (req.id === requestId) {
                const updatedReq = { ...req, [field]: value };
                if (field === 'assigned_to') {
                    const profile = profiles.find(p => p.id === value);
                    updatedReq.assignee = profile ? { id: profile.id, full_name: profile.full_name } : null;
                }
                return updatedReq;
            }
            return req;
        });

        setRequests(updatedRequests);

        try {
            const response = await fetch(`/api/requests?id=${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });

            if (!response.ok) {
                setRequests(originalRequests);
                alert(`Failed to update ${field}`);
            }
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            setRequests(originalRequests);
        }
    };

    return (
        <div className="flex h-screen bg-[#09090B] text-iron font-sans overflow-hidden">
            <Sidebar isCollapsed={isSidebarCollapsed} />

            <div className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative">
                <div className="flex-1 flex flex-col min-w-0 bg-[#121214] rounded-t-2xl overflow-hidden border-t border-l border-r border-shark mt-6 mr-6">
                    <Header
                        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        label="Requests"
                        labelIcon={<ListFilter size={16} className="text-santas-gray" />}
                        tabs={subTabs}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onCreate={() => setIsCreateModalOpen(true)}
                    />

                    <main className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="px-6 pb-6 pt-2">
                            {/* Consistent Content Wrapper */}
                            <div className="bg-[#18181B] border border-shark rounded-2xl p-6 min-h-[calc(100vh-160px)] shadow-2xl">

                                {/* Toolbar */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="relative w-80">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-santas-gray" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search for a request..."
                                            className="w-full bg-[#09090B] border border-shark/50 rounded-lg py-2 pl-10 pr-4 text-xs text-iron placeholder:text-storm-gray focus:outline-none focus:border-[#279da6]/40 transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-shark bg-shark/20 text-[11px] font-bold text-santas-gray hover:text-white transition-all">
                                            <div className="p-1 bg-shark rounded-sm">
                                                <Upload size={10} />
                                            </div>
                                            <span>import</span>
                                        </button>
                                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-shark bg-shark/20 text-[11px] font-bold text-santas-gray hover:text-white transition-all">
                                            <span>All Status</span>
                                            <ChevronDown size={14} className="text-storm-gray" />
                                        </button>
                                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-shark bg-shark/20 text-[11px] font-bold text-santas-gray hover:text-white transition-all">
                                            <CalendarIcon size={14} className="text-storm-gray" />
                                            <span>Last 30 Days</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="border border-shark/60 rounded-xl overflow-hidden bg-black/20">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse table-auto">
                                            <thead>
                                                <tr className="border-b border-shark text-storm-gray text-[10px] uppercase font-bold tracking-wider bg-shark/20">
                                                    <th className="px-5 py-4 w-10 border-r border-shark/60"><input type="checkbox" /></th>
                                                    {[
                                                        'Title', 'Client', 'Status', 'Assigned', 'Priority', 'Due Date', 'Last Updated', 'Created'
                                                    ].map((header, idx) => (
                                                        <th key={header} className={`px-6 py-4 border-r border-shark/60 ${idx === 7 ? 'border-r-0' : ''}`}>
                                                            <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                                                                {header}
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-shark/60">
                                                {isLoading ? (
                                                    <tr>
                                                        <td colSpan={10} className="px-6 py-20 text-center">
                                                            <div className="flex flex-col items-center gap-3">
                                                                <Loader2 size={24} className="animate-spin text-[#279da6]" />
                                                                <span className="text-[10px] font-black text-storm-gray uppercase tracking-widest">Loading requests...</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : requests.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={10} className="px-6 py-20 text-center text-storm-gray uppercase text-[10px] font-black tracking-widest opacity-40">
                                                            No requests found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    requests.map((item) => (
                                                        <tr key={item.id} className="hover:bg-shark/10 transition-colors group text-[11px]">
                                                            <td className="px-5 py-3.5 border-r border-shark/60"><input type="checkbox" /></td>
                                                            <td
                                                                className="px-6 py-3.5 font-bold text-iron border-r border-shark/60 group-hover:text-[#279da6] whitespace-nowrap cursor-pointer transition-colors"
                                                                onClick={() => router.push(`/requests/${item.id}`)}
                                                            >
                                                                {item.title}
                                                            </td>
                                                            <td className="px-6 py-3.5 text-santas-gray border-r border-shark/60 whitespace-nowrap">
                                                                {item.client?.full_name || 'Unknown'}
                                                            </td>
                                                            <td className="px-6 py-3.5 border-r border-shark/60">
                                                                <select
                                                                    value={item.status}
                                                                    onChange={(e) => handleUpdateField(item.id, 'status', e.target.value)}
                                                                    className={`bg-transparent font-bold text-[10px] uppercase tracking-wider focus:outline-none cursor-pointer hover:underline py-0.5 px-2 rounded-md border
                                                                    ${item.status === 'Done' ? 'bg-[#10B981]/5 text-[#10B981] border-[#10B981]/20' :
                                                                            item.status === 'In Progress' ? 'bg-[#EAB308]/5 text-[#EAB308] border-[#EAB308]/20' :
                                                                                item.status === 'Review' ? 'bg-blue-500/5 text-blue-400 border-blue-400/20' :
                                                                                    'bg-[#279da6]/5 text-[#279da6] border-[#279da6]/20'
                                                                        }`}
                                                                >
                                                                    <option value="Todo" className="bg-[#121214]">Todo</option>
                                                                    <option value="In Progress" className="bg-[#121214]">In Progress</option>
                                                                    <option value="Review" className="bg-[#121214]">Review</option>
                                                                    <option value="Done" className="bg-[#121214]">Done</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-6 py-3.5 text-santas-gray border-r border-shark/60 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-5 h-5 rounded-full bg-shark/40 border border-shark flex items-center justify-center text-storm-gray overflow-hidden shrink-0">
                                                                        {item.assignee ? (
                                                                            <div className="w-full h-full bg-[#279da6] text-white flex items-center justify-center text-[8px] font-black">
                                                                                {item.assignee.full_name?.split(' ').map(n => n[0]).join('')}
                                                                            </div>
                                                                        ) : (
                                                                            <PlusIcon size={10} />
                                                                        )}
                                                                    </div>
                                                                    <select
                                                                        value={item.assigned_to || ''}
                                                                        onChange={(e) => handleUpdateField(item.id, 'assigned_to', e.target.value)}
                                                                        className="bg-transparent text-[11px] font-bold text-iron focus:outline-none cursor-pointer hover:text-white transition-all appearance-none"
                                                                    >
                                                                        <option value="" className="bg-[#121214]">Unassigned</option>
                                                                        {profiles.map(p => (
                                                                            <option key={p.id} value={p.id} className="bg-[#121214]">{p.full_name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3.5 border-r border-shark/60 font-bold">
                                                                <select
                                                                    value={item.priority}
                                                                    onChange={(e) => handleUpdateField(item.id, 'priority', e.target.value)}
                                                                    className={`bg-transparent text-[11px] font-bold focus:outline-none cursor-pointer hover:underline
                                                                    ${item.priority === 'Critical' ? 'text-rose-500' :
                                                                            item.priority === 'High' ? 'text-amber-500' :
                                                                                item.priority === 'Medium' ? 'text-blue-400' :
                                                                                    'text-storm-gray'
                                                                        }`}
                                                                >
                                                                    <option value="Low" className="bg-[#121214]">Low</option>
                                                                    <option value="Medium" className="bg-[#121214]">Medium</option>
                                                                    <option value="High" className="bg-[#121214]">High</option>
                                                                    <option value="Critical" className="bg-[#121214]">Critical</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-6 py-3.5 text-storm-gray border-r border-shark/60 whitespace-nowrap">
                                                                <div className="flex items-center gap-2 group/date">
                                                                    <input
                                                                        ref={el => { dateInputRefs.current[item.id] = el; }}
                                                                        type="date"
                                                                        value={item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : ''}
                                                                        onChange={(e) => handleUpdateField(item.id, 'due_date', e.target.value)}
                                                                        className="bg-transparent text-iron border-none focus:outline-none cursor-pointer hover:text-white transition-all text-[11px] font-bold uppercase w-24 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden"
                                                                    />
                                                                    <CalendarIcon
                                                                        size={12}
                                                                        className="text-storm-gray opacity-50 group-hover/date:opacity-100 transition-opacity cursor-pointer"
                                                                        onClick={() => dateInputRefs.current[item.id]?.showPicker()}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3.5 text-storm-gray border-r border-shark/60 whitespace-nowrap text-[10px]">
                                                                {item.updated_at ? (
                                                                    <div className="flex flex-col">
                                                                        <span className="text-iron font-bold">{new Date(item.updated_at).toLocaleDateString()}</span>
                                                                        <span className="opacity-50">{new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </div>
                                                                ) : '-'}
                                                            </td>
                                                            <td className="px-6 py-3.5 text-storm-gray whitespace-nowrap text-[10px]">
                                                                <div className="flex flex-col">
                                                                    <span className="text-iron font-bold">{new Date(item.created_at).toLocaleDateString()}</span>
                                                                    <span className="opacity-50">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <ChatDrawer
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                requestId={selectedRequest?.id || ''}
                requestTitle={selectedRequest?.title || ''}
            />

            <CreateRequestModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchRequests}
            />
        </div>
    );
}


