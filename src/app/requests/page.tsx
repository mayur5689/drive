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
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ChatDrawer from '@/components/ChatDrawer';
import CreateRequestModal from '@/components/CreateRequestModal';

interface RequestItem {
    id: string;
    title: string;
    description: string;
    client: { full_name: string; email: string } | null;
    status: 'Todo' | 'In Progress' | 'Done';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    assignee: { full_name: string } | null;
    due_date: string;
    created_at: string;
}

export default function RequestsPage() {
    const router = useRouter();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('All');
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const subTabs = ['All', 'Assigned', 'Open', 'Unassigned', 'Completed'];

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/requests');
            const data = await response.json();
            if (response.ok) {
                setRequests(data);
            }
        } catch (error) {
            console.error('Failed to fetch requests:', error);
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
                                                        'Title', 'Client', 'Status', 'Assigned', 'Priority', 'Due Date', 'Created', 'Action'
                                                    ].map((header, idx) => (
                                                        <th key={header} className={`px-6 py-4 border-r border-shark/60 ${idx === 7 ? 'border-r-0' : ''}`}>
                                                            <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                                                                {header} <ChevronDown size={12} />
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
                                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold border ${item.status === 'Done' ? 'bg-[#10B981]/5 text-[#10B981] border-[#10B981]/10' :
                                                                    item.status === 'In Progress' ? 'bg-[#EAB308]/5 text-[#EAB308] border-[#EAB308]/10' :
                                                                        'bg-[#279da6]/5 text-[#279da6] border-[#279da6]/10'
                                                                    }`}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Done' ? 'bg-[#10B981]' : item.status === 'In Progress' ? 'bg-[#EAB308]' : 'bg-[#279da6]'}`} />
                                                                    {item.status}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3.5 text-santas-gray border-r border-shark/60 whitespace-nowrap">
                                                                {item.assignee?.full_name || 'Unassigned'}
                                                            </td>
                                                            <td className="px-6 py-3.5 border-r border-shark/60 font-bold">
                                                                <span className={
                                                                    item.priority === 'Critical' ? 'text-rose-500' :
                                                                        item.priority === 'High' ? 'text-amber-500' :
                                                                            item.priority === 'Medium' ? 'text-blue-400' :
                                                                                'text-storm-gray'
                                                                }>{item.priority}</span>
                                                            </td>
                                                            <td className="px-6 py-3.5 text-storm-gray border-r border-shark/60 whitespace-nowrap">
                                                                {item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}
                                                            </td>
                                                            <td className="px-6 py-3.5 text-storm-gray border-r border-shark/60 whitespace-nowrap">
                                                                {new Date(item.created_at).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-3.5 text-center">
                                                                <button
                                                                    onClick={() => router.push(`/requests/${item.id}`)}
                                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#279da6]/10 text-[#279da6] hover:bg-[#279da6] hover:text-white transition-all font-black text-[10px] uppercase shadow-sm"
                                                                >
                                                                    <span>View</span>
                                                                </button>
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


