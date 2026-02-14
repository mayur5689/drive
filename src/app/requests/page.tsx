'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
    Search,
    Download,
    Plus,
    Calendar as CalendarIcon,
    ArrowUpDown,
    CheckCircle2,
    Clock,
    ChevronDown,
    ListFilter,
    Upload,
    AlertCircle
} from 'lucide-react';

interface RequestItem {
    id: string;
    title: string;
    client: string;
    status: 'Todo' | 'In Progress' | 'Done';
    assigned: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    updated: string;
    dueDate: string;
    created: string;
}

const mockRequests: RequestItem[] = [
    {
        id: '1',
        title: 'Document API endpoints',
        client: 'Novino Tech',
        status: 'Todo',
        assigned: 'Pat Casey',
        priority: 'Medium',
        updated: 'Feb 14, 2026',
        dueDate: 'Mar 6, 2026',
        created: 'Feb 10, 2026'
    },
    {
        id: '2',
        title: 'Add dark mode support',
        client: 'AneeVerse',
        status: 'Done',
        assigned: 'Jamie Fox',
        priority: 'High',
        updated: 'Feb 13, 2026',
        dueDate: 'Feb 13, 2026',
        created: 'Feb 05, 2026'
    },
    {
        id: '3',
        title: 'Fix memory leak',
        client: 'Global Solutions',
        status: 'Todo',
        assigned: 'Jordan White',
        priority: 'Critical',
        updated: 'Feb 14, 2026',
        dueDate: 'Mar 1, 2026',
        created: 'Feb 12, 2026'
    },
    {
        id: '4',
        title: 'Unit tests for issues',
        client: 'Starlight Inc',
        status: 'In Progress',
        assigned: 'Taylor Brooks',
        priority: 'Low',
        updated: 'Feb 14, 2026',
        dueDate: 'Feb 22, 2026',
        created: 'Feb 11, 2026'
    },
    {
        id: '5',
        title: 'Refactor endpoints',
        client: 'NexGen Lab',
        status: 'Todo',
        assigned: 'Morgan Yu',
        priority: 'Medium',
        updated: 'Feb 12, 2026',
        dueDate: 'Feb 26, 2026',
        created: 'Feb 08, 2026'
    },
];

export default function RequestsPage() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('Assigned');

    const subTabs = ['Assigned', 'Open', 'All', 'Unassigned', 'Completed'];

    return (
        <div className="flex h-screen bg-[#09090B] text-iron font-sans overflow-hidden">
            <Sidebar isCollapsed={isSidebarCollapsed} />

            <div className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative">
                <Header
                    onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    label="Requests"
                    labelIcon={<ListFilter size={16} className="text-santas-gray" />}
                    tabs={subTabs}
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
                                                    'Title', 'Client', 'Status', 'Assigned', 'Priority', 'Updated', 'Due Date', 'Created'
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
                                            {mockRequests.map((item) => (
                                                <tr key={item.id} className="hover:bg-shark/10 transition-colors group text-[11px]">
                                                    <td className="px-5 py-3.5 border-r border-shark/60"><input type="checkbox" /></td>
                                                    <td className="px-6 py-3.5 font-bold text-iron border-r border-shark/60 group-hover:text-white">
                                                        {item.title}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-santas-gray border-r border-shark/60">{item.client}</td>
                                                    <td className="px-6 py-3.5 border-r border-shark/60">
                                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold border ${item.status === 'Done' ? 'bg-[#10B981]/5 text-[#10B981] border-[#10B981]/10' :
                                                                item.status === 'In Progress' ? 'bg-[#EAB308]/5 text-[#EAB308] border-[#EAB308]/10' :
                                                                    'bg-[#279da6]/5 text-[#279da6] border-[#279da6]/10'
                                                            }`}>
                                                            {item.status === 'Done' && <CheckCircle2 size={10} />}
                                                            {item.status === 'In Progress' && <HourglassIcon size={10} />}
                                                            {item.status === 'Todo' && <Clock size={10} />}
                                                            {item.status}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-santas-gray border-r border-shark/60">{item.assigned}</td>
                                                    <td className="px-6 py-3.5 border-r border-shark/60 font-bold">
                                                        <span className={
                                                            item.priority === 'Critical' ? 'text-rose-500' :
                                                                item.priority === 'High' ? 'text-amber-500' :
                                                                    item.priority === 'Medium' ? 'text-blue-400' :
                                                                        'text-storm-gray'
                                                        }>{item.priority}</span>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-storm-gray border-r border-shark/60">{item.updated}</td>
                                                    <td className="px-6 py-3.5 text-storm-gray border-r border-shark/60">{item.dueDate}</td>
                                                    <td className="px-6 py-3.5 text-storm-gray">{item.created}</td>
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

const HourglassIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></svg>
);
