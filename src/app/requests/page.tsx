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
    Upload
} from 'lucide-react';

interface RequestItem {
    id: string;
    title: string;
    status: 'Todo' | 'In Progress' | 'Done';
    type: 'Feature' | 'Bug' | 'Improvement';
    assignee: string;
    dueDate: string;
}

const mockRequests: RequestItem[] = [
    { id: '1', title: 'Document API endpoints', status: 'Todo', type: 'Improvement', assignee: 'Pat Casey', dueDate: 'Mar 6, 2026' },
    { id: '2', title: 'Add dark mode support', status: 'Done', type: 'Feature', assignee: 'Jamie Fox', dueDate: 'Feb 13, 2026' },
    { id: '3', title: 'Fix memory leak in notifications', status: 'Todo', type: 'Bug', assignee: 'Jordan White', dueDate: 'Mar 1, 2026' },
    { id: '4', title: 'Write unit tests for issues', status: 'In Progress', type: 'Improvement', assignee: 'Taylor Brooks', dueDate: 'Feb 22, 2026' },
    { id: '5', title: 'Refactor API endpoints', status: 'Todo', type: 'Improvement', assignee: 'Morgan Yu', dueDate: 'Feb 26, 2026' },
    { id: '6', title: 'Implement notifications', status: 'In Progress', type: 'Feature', assignee: 'Chris Kim', dueDate: 'Feb 19, 2026' },
    { id: '7', title: 'Integrate analytics service', status: 'Todo', type: 'Feature', assignee: 'Sam Patel', dueDate: 'Feb 28, 2026' },
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
                                        placeholder="Search issue"
                                        className="w-full bg-[#09090B] border border-shark/50 rounded-lg py-2 pl-10 pr-4 text-xs text-iron placeholder:text-storm-gray focus:outline-none focus:border-[#7C86FF]/40 transition-all"
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
                                        <span>All</span>
                                        <ChevronDown size={14} className="text-storm-gray" />
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-shark bg-shark/20 text-[11px] font-bold text-santas-gray hover:text-white transition-all">
                                        <CalendarIcon size={14} className="text-storm-gray" />
                                        <span>14-2-2026</span>
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
                                                <th className="px-6 py-4 border-r border-shark/60">
                                                    <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                                                        Title <ChevronDown size={12} />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 border-r border-shark/60">
                                                    <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                                                        Status <ChevronDown size={12} />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 border-r border-shark/60">
                                                    <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                                                        Type <ChevronDown size={12} />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 border-r border-shark/60">
                                                    <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                                                        Assignee <ChevronDown size={12} />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4">
                                                    <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                                                        Due Date <ChevronDown size={12} />
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-shark/60">
                                            {mockRequests.map((item) => (
                                                <tr key={item.id} className="hover:bg-shark/10 transition-colors group">
                                                    <td className="px-5 py-3.5 border-r border-shark/60"><input type="checkbox" /></td>
                                                    <td className="px-6 py-3.5 text-[12px] font-medium text-storm-gray border-r border-shark/60">
                                                        <span className="group-hover:text-iron transition-colors">{item.title}</span>
                                                    </td>
                                                    <td className="px-6 py-3.5 border-r border-shark/60">
                                                        <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-md text-[10px] font-bold border ${item.status === 'Done' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                                                                item.status === 'In Progress' ? 'bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/20' :
                                                                    'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20'
                                                            }`}>
                                                            {item.status === 'Done' && <CheckCircle2 size={10} />}
                                                            {item.status === 'In Progress' && <HourglassIcon size={10} />}
                                                            {item.status === 'Todo' && <Clock size={10} />}
                                                            {item.status}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-[11px] font-bold text-storm-gray border-r border-shark/60">
                                                        {item.type}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-[11px] text-storm-gray border-r border-shark/60">
                                                        {item.assignee}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-[11px] text-storm-gray">
                                                        {item.dueDate}
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

const HourglassIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></svg>
);
