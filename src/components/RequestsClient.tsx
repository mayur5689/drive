'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
    Search,
    ChevronDown,
    Calendar as CalendarIcon,
    Loader2,
    Plus as PlusIcon,
    Filter,
    SlidersHorizontal,
    LayoutList,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ChatDrawer from '@/components/ChatDrawer';
import CreateRequestModal from '@/components/CreateRequestModal';
import type { RequestItem, Profile, TeamMember } from '@/lib/data/requests';

interface RequestsClientProps {
    initialRequests: RequestItem[];
    initialProfiles: Profile[];
    initialTeamMembers: TeamMember[];
}



export default function RequestsClient({
    initialRequests,
    initialProfiles,
    initialTeamMembers
}: RequestsClientProps) {
    const router = useRouter();
    const { isImpersonating, profile, viewAsProfile, impersonatedProfile } = useAuth();
    const displayProfile = viewAsProfile || profile;

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('All');
    const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        client: '',
        organization: '',
        assigned_to: '',
        status: '',
        priority: '',
        request_number: '',
        due_date: ''
    });
    const dateInputRefs = React.useRef<{ [key: string]: HTMLInputElement | null }>({});

    const subTabs = ['All', 'Assigned', 'Open', 'Unassigned', 'Completed'];

    const [requests, setRequests] = useState<RequestItem[]>(initialRequests);
    const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);

    // Update state when initial props change (from SSR refresh)
    React.useEffect(() => {
        setRequests(initialRequests);
        setProfiles(initialProfiles);
        setTeamMembers(initialTeamMembers);
    }, [initialRequests, initialProfiles, initialTeamMembers]);

    const handleOpenChat = (request: RequestItem) => {
        setSelectedRequest(request);
        setIsChatOpen(true);
    };

    const handleUpdateField = async (requestId: string, field: string, value: any) => {
        const originalRequests = [...requests];

        // Optimistic UI update
        const updatedRequests = requests.map((req: RequestItem) => {
            if (req.id === requestId) {
                const updatedReq = { ...req, [field]: value };
                if (field === 'assigned_to') {
                    const profile = profiles.find((p: Profile) => p.id === value);
                    updatedReq.assignee = profile ? { id: profile.id, full_name: profile.full_name } : null;
                }
                return updatedReq;
            }
            return req;
        });

        // Update local state immediately
        setRequests(updatedRequests);

        try {
            const response = await fetch(`/api/requests?id=${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });

            if (!response.ok) {
                // Rollback on error
                setRequests(originalRequests);
                alert(`Failed to update ${field}`);
            } else {
                // Revalidate to get fresh data from server
                router.refresh();
            }
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            setRequests(originalRequests);
        }
    };

    const handleRequestCreated = () => {
        // Revalidate requests after creating a new one
        router.refresh();
    };

    // Data visibility logic
    const isTeamMember = displayProfile?.role === 'team_member';
    const isTeamAdmin = displayProfile?.team_role === 'admin';
    const isClient = displayProfile?.role === 'client';

    const visibleRequests = (() => {
        if (isClient) {
            return requests.filter((req: RequestItem) => req.client?.id === displayProfile?.id);
        }
        if (isTeamMember && !isTeamAdmin) {
            return requests.filter((req: RequestItem) => req.assigned_to === displayProfile?.id);
        }
        return requests;
    })();

    const filteredRequests = visibleRequests.filter((req: RequestItem) => {
        // Search query
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            req.title?.toLowerCase().includes(searchLower) ||
            req.client?.full_name?.toLowerCase().includes(searchLower) ||
            (req.client as any)?.organization?.toLowerCase().includes(searchLower);

        // Tab filters
        let matchesTab = true;
        if (activeTab === 'Assigned') matchesTab = !!req.assigned_to;
        else if (activeTab === 'Unassigned') matchesTab = !req.assigned_to;
        else if (activeTab === 'Open') matchesTab = req.status !== 'Done';
        else if (activeTab === 'Completed') matchesTab = req.status === 'Done';

        // Advanced filters
        const matchesClient = !filters.client || req.client?.full_name?.toLowerCase().includes(filters.client.toLowerCase());
        const matchesOrg = !filters.organization || (req.client as any)?.organization?.toLowerCase().includes(filters.organization.toLowerCase());
        const matchesAssignee = !filters.assigned_to || req.assigned_to === filters.assigned_to;
        const matchesStatus = !filters.status || req.status === filters.status;
        const matchesPriority = !filters.priority || req.priority === filters.priority;
        const matchesNumber = !filters.request_number || req.request_number?.toString() === filters.request_number;
        const matchesDate = !filters.due_date || (req.due_date && req.due_date.startsWith(filters.due_date));

        return (matchesSearch || false) && matchesTab && (matchesClient || false) && (matchesOrg || false) && matchesAssignee && matchesStatus && matchesPriority && matchesNumber && matchesDate;
    });

    return (
        <div className={`flex h-screen bg-[#09090B] text-iron font-sans overflow-hidden transition-all duration-500 ${isImpersonating ? 'p-1.5' : ''}`} style={isImpersonating ? { backgroundColor: '#0f2b1a' } : undefined}>
            <Sidebar isCollapsed={isSidebarCollapsed} />

            <div className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative">
                <div className={`flex-1 flex flex-col min-w-0 bg-[#121214] rounded-t-2xl overflow-hidden border-t border-l border-r mt-6 mr-6 transition-all duration-500 ${isImpersonating ? 'border-[#22c55e]/60 shadow-[0_0_15px_rgba(34,197,94,0.15),0_0_40px_rgba(34,197,94,0.08),inset_0_0_20px_rgba(34,197,94,0.03)]' : 'border-shark'}`}>
                    <Header
                        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        label="Requests"
                        labelIcon={<LayoutList size={16} className="text-santas-gray" />}
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
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-80">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-santas-gray" size={14} />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search for a request..."
                                                className="w-full bg-[#09090B] border border-shark/50 rounded-lg py-1.5 pl-9 pr-4 text-[11px] text-iron placeholder:text-storm-gray focus:outline-none focus:border-[#279da6]/40 transition-all font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold ${isFilterOpen ? 'bg-[#279da6]/10 border-[#279da6]/40 text-[#279da6]' : 'border-shark bg-[#121214] text-santas-gray hover:text-white'}`}
                                            >
                                                <Filter size={14} />
                                                <span>Filters</span>
                                                <ChevronDown size={14} className={isFilterOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                            </button>

                                            {isFilterOpen && (
                                                <div className="absolute right-0 mt-2 w-72 bg-[#121214] border border-shark rounded-xl shadow-2xl p-5 z-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="text-[12px] font-black uppercase tracking-widest text-[#279da6]">Advanced Filters</h4>
                                                        <button
                                                            onClick={() => {
                                                                setFilters({
                                                                    client: '',
                                                                    organization: '',
                                                                    assigned_to: '',
                                                                    status: '',
                                                                    priority: '',
                                                                    request_number: '',
                                                                    due_date: ''
                                                                });
                                                            }}
                                                            className="text-[10px] font-bold text-storm-gray hover:text-white underline underline-offset-4"
                                                        >
                                                            Reset all
                                                        </button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold text-storm-gray uppercase">Client</label>
                                                            <input
                                                                type="text"
                                                                value={filters.client}
                                                                onChange={(e) => setFilters(f => ({ ...f, client: e.target.value }))}
                                                                className="w-full bg-[#09090B] border border-shark rounded-lg px-3 py-1.5 text-[11px] font-bold focus:outline-none focus:border-[#279da6]/40 text-iron"
                                                                placeholder="Client name..."
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold text-storm-gray uppercase">Organization</label>
                                                            <input
                                                                type="text"
                                                                value={filters.organization}
                                                                onChange={(e) => setFilters(f => ({ ...f, organization: e.target.value }))}
                                                                className="w-full bg-[#09090B] border border-shark rounded-lg px-3 py-1.5 text-[11px] font-bold focus:outline-none focus:border-[#279da6]/40 text-iron"
                                                                placeholder="Organization name..."
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-bold text-storm-gray uppercase">Assigned To</label>
                                                                <select
                                                                    value={filters.assigned_to}
                                                                    onChange={(e) => setFilters(f => ({ ...f, assigned_to: e.target.value }))}
                                                                    className="w-full bg-[#09090B] border border-shark rounded-lg px-2 py-1.5 text-[11px] font-bold focus:outline-none focus:border-[#279da6]/40 text-iron"
                                                                >
                                                                    <option value="">All</option>
                                                                    {profiles.map((p: Profile) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-bold text-storm-gray uppercase">Status</label>
                                                                <select
                                                                    value={filters.status}
                                                                    onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                                                                    className="w-full bg-[#09090B] border border-shark rounded-lg px-2 py-1.5 text-[11px] font-bold focus:outline-none focus:border-[#279da6]/40 text-iron"
                                                                >
                                                                    <option value="">All</option>
                                                                    <option value="Todo">Todo</option>
                                                                    <option value="In Progress">In Progress</option>
                                                                    <option value="Review">Review</option>
                                                                    <option value="Done">Done</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-bold text-storm-gray uppercase">Priority</label>
                                                                <select
                                                                    value={filters.priority}
                                                                    onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
                                                                    className="w-full bg-[#09090B] border border-shark rounded-lg px-2 py-1.5 text-[11px] font-bold focus:outline-none focus:border-[#279da6]/40 text-iron"
                                                                >
                                                                    <option value="">All</option>
                                                                    <option value="Low">Low</option>
                                                                    <option value="Medium">Medium</option>
                                                                    <option value="High">High</option>
                                                                    <option value="Critical">Critical</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-bold text-storm-gray uppercase">Due Date</label>
                                                                <input
                                                                    type="date"
                                                                    value={filters.due_date}
                                                                    onChange={(e) => setFilters(f => ({ ...f, due_date: e.target.value }))}
                                                                    className="w-full bg-[#09090B] border border-shark rounded-lg px-2 py-1.5 text-[11px] font-bold focus:outline-none focus:border-[#279da6]/40 text-iron"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-[1px] h-4 bg-shark/60 mx-1" />

                                        <button className="p-2 rounded-lg border border-shark bg-[#121214] text-santas-gray hover:text-white transition-all hover:bg-shark/40">
                                            <SlidersHorizontal size={14} />
                                        </button>

                                        <div className="w-[1px] h-4 bg-shark/60 mx-1" />

                                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-shark bg-[#121214] text-[11px] font-bold text-santas-gray hover:text-white transition-all hover:bg-shark/40">
                                            <LayoutList size={14} />
                                            <span>List</span>
                                            <ChevronDown size={14} />
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
                                                {filteredRequests.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={10} className="px-6 py-20 text-center text-storm-gray uppercase text-[10px] font-black tracking-widest opacity-40">
                                                            No matches found for your criteria.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredRequests.map((item: RequestItem) => (
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
                                                                                {item.assignee.full_name?.split(' ').map((n: string) => n[0]).join('')}
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
                                                                        {teamMembers.filter((tm: any) => tm.profile_id).map((tm: any) => (
                                                                            <option key={tm.id} value={tm.profile_id} className="bg-[#121214]">{tm.name}</option>
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
                onSuccess={handleRequestCreated}
            />
        </div >
    );
}
