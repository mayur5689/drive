'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
    Search,
    ChevronDown,
    Calendar as CalendarIcon,
    Plus as PlusIcon,
    Filter,
    SlidersHorizontal,
    LayoutList,
    Box
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CreateTaskModal from '@/components/CreateTaskModal';
import { TaskItem } from '@/lib/data/tasks';

interface TasksClientProps {
    initialTasks: TaskItem[];
    profiles: any[];
    teamMembers: any[];
}

export default function TasksClient({ initialTasks, profiles, teamMembers }: TasksClientProps) {
    const router = useRouter();
    const { user, isImpersonating, profile, viewAsProfile } = useAuth();
    const displayProfile = viewAsProfile || profile;

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('All Tasks');
    const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        assigned_to: '',
        status: '',
        priority: '',
        due_date: ''
    });
    const dateInputRefs = React.useRef<{ [key: string]: HTMLInputElement | null }>({});

    const taskTabs = ['All Tasks', 'My Tasks', 'In Progress', 'Done'];

    // Update state when initial props change (from SSR refresh)
    React.useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const handleUpdateField = async (taskId: string, field: string, value: any) => {
        const originalTasks = [...tasks];

        // Optimistic UI update
        const updatedTasks = tasks.map((task: TaskItem) => {
            if (task.id === taskId) {
                const updatedTask = { ...task, [field]: value };
                if (field === 'assigned_to') {
                    const p = profiles.find((pr: any) => pr.id === value);
                    updatedTask.assignee = p ? { id: p.id, full_name: p.full_name } : null;
                }
                return updatedTask;
            }
            return task;
        });

        setTasks(updatedTasks);

        try {
            const response = await fetch(`/api/tasks`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: taskId,
                    [field]: value
                })
            });

            if (!response.ok) {
                setTasks(originalTasks);
                alert(`Failed to update ${field}`);
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            setTasks(originalTasks);
        }
    };

    const handleTaskCreated = (newTask: TaskItem) => {
        setTasks([newTask, ...tasks]);
    };

    // Data visibility logic
    const isTeamMember = displayProfile?.role === 'team_member';
    const isTeamAdmin = (displayProfile as any)?.team_role === 'admin';

    const visibleTasks = (() => {
        if (isTeamMember && !isTeamAdmin) {
            return tasks.filter((t: TaskItem) => t.assigned_to === displayProfile?.id);
        }
        return tasks;
    })();

    const filteredTasks = visibleTasks.filter((task: TaskItem) => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            task.title?.toLowerCase().includes(searchLower) ||
            task.description?.toLowerCase().includes(searchLower);

        // Tab filters
        let matchesTab = true;
        if (activeTab === 'My Tasks') matchesTab = task.assigned_to === user?.id;
        else if (activeTab === 'In Progress') matchesTab = task.status === 'In Progress';
        else if (activeTab === 'Done') matchesTab = task.status === 'Done';

        // Advanced filters
        const matchesAssignee = !filters.assigned_to || task.assigned_to === filters.assigned_to;
        const matchesStatus = !filters.status || task.status === filters.status;
        const matchesPriority = !filters.priority || task.priority === filters.priority;
        const matchesDate = !filters.due_date || (task.due_date && task.due_date.startsWith(filters.due_date));

        return (matchesSearch || false) && matchesTab && matchesAssignee && matchesStatus && matchesPriority && matchesDate;
    });

    return (
        <div className={`flex h-screen bg-[#09090B] text-iron font-sans overflow-hidden transition-all duration-500 ${isImpersonating ? 'p-1.5' : ''}`} style={isImpersonating ? { backgroundColor: '#0f2b1a' } : undefined}>
            <Sidebar isCollapsed={isSidebarCollapsed} />

            <div className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative">
                <div className={`flex-1 flex flex-col min-w-0 bg-[#121214] rounded-t-2xl overflow-hidden border-t border-l border-r mt-6 mr-6 transition-all duration-500 ${isImpersonating ? 'border-[#22c55e]/60 shadow-[0_0_15px_rgba(34,197,94,0.15),0_0_40px_rgba(34,197,94,0.08),inset_0_0_20px_rgba(34,197,94,0.03)]' : 'border-shark'}`}>
                    <Header
                        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        label="Team Tasks"
                        labelIcon={<Box size={16} className="text-santas-gray" />}
                        tabs={taskTabs}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onCreate={() => setShowCreateModal(true)}
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
                                                placeholder="Search tasks..."
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
                                                                    assigned_to: '',
                                                                    status: '',
                                                                    priority: '',
                                                                    due_date: ''
                                                                });
                                                            }}
                                                            className="text-[10px] font-bold text-storm-gray hover:text-white underline underline-offset-4"
                                                        >
                                                            Reset all
                                                        </button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-bold text-storm-gray uppercase">Assigned To</label>
                                                                <select
                                                                    value={filters.assigned_to}
                                                                    onChange={(e) => setFilters(f => ({ ...f, assigned_to: e.target.value }))}
                                                                    className="w-full bg-[#09090B] border border-shark rounded-lg px-2 py-1.5 text-[11px] font-bold focus:outline-none focus:border-[#279da6]/40 text-iron"
                                                                >
                                                                    <option value="">All</option>
                                                                    {profiles.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
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
                                                                    className="w-full bg-[#09090B] border border-shark rounded-lg px-2 py-1.5 text-[11px] font-bold focus:outline-none focus:border-[#279da6]/40 text-iron [color-scheme:dark]"
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
                                                        'Title', 'Creator', 'Status', 'Assigned', 'Priority', 'Due Date', 'Last Updated', 'Created'
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
                                                {filteredTasks.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={10} className="px-6 py-20 text-center text-storm-gray uppercase text-[10px] font-black tracking-widest opacity-40">
                                                            No tasks found for your criteria.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredTasks.map((item: TaskItem) => (
                                                        <tr key={item.id} className="hover:bg-shark/10 transition-colors group text-[11px]">
                                                            <td className="px-5 py-3.5 border-r border-shark/60"><input type="checkbox" /></td>
                                                            <td
                                                                className="px-6 py-3.5 font-bold text-iron border-r border-shark/60 group-hover:text-[#279da6] whitespace-nowrap cursor-pointer transition-colors"
                                                                onClick={() => router.push(`/tasks/${item.id}`)}
                                                            >
                                                                {item.title}
                                                            </td>
                                                            <td className="px-6 py-3.5 text-santas-gray border-r border-shark/60 whitespace-nowrap">
                                                                {item.creator?.full_name || 'System'}
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

            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleTaskCreated}
                profiles={profiles}
                teamMembers={teamMembers}
            />
        </div>
    );
}
