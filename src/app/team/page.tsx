'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
    Search,
    Plus,
    Filter,
    Users,
    X,
    Eye,
    EyeOff,
    Loader2,
    Edit2,
    Trash2,
    AlertTriangle,
    MoreHorizontal,
    UserCog,
    FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface TeamMember {
    id: string;
    profile_id?: string | null;
    name: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    status: string;
    created_at: string;
    last_login: string | null;
    avatar_url?: string | null;
    request_count?: number;
}

export default function TeamPage() {
    const router = useRouter();
    const { impersonate, isImpersonating } = useAuth();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('All Members');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // State for Data
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'viewer'
    });

    const memberCategories = ['All Members', 'Active', 'Inactive'];

    // Fetch Team Members
    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/team');
            const data = await response.json();
            if (response.ok) {
                // Fetch request assignment counts
                let countMap: Record<string, number> = {};
                try {
                    const countRes = await fetch('/api/team/counts');
                    if (countRes.ok) {
                        const counts = await countRes.json();
                        countMap = counts;
                    }
                } catch (e) { /* counts are optional */ }

                const mappedData = data.map((m: any) => ({
                    ...m,
                    role: m.position || 'viewer',
                    created_at: new Date(m.created_at).toLocaleDateString(),
                    last_login: m.last_login ? new Date(m.last_login).toLocaleString() : 'Never',
                    request_count: countMap[m.id] || 0
                }));
                setMembers(mappedData);
            }
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'viewer' });
        setSelectedMember(null);
    };

    // Handle Create Form Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords don't match!");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    position: formData.role,
                    role: formData.role
                })
            });

            if (response.ok) {
                setIsModalOpen(false);
                resetForm();
                fetchMembers();
            } else {
                const err = await response.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error('Submit failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Edit Click
    const handleEditClick = (member: TeamMember) => {
        setSelectedMember(member);
        setFormData({
            name: member.name,
            email: member.email,
            password: '',
            confirmPassword: '',
            role: member.role || 'viewer'
        });
        setIsEditModalOpen(true);
        setActiveDropdown(null);
    };

    // Handle Edit Submit
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;
        if (formData.password && formData.password !== formData.confirmPassword) {
            alert("Passwords don't match!");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/team', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedMember.id,
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    position: formData.role,
                    oldEmail: selectedMember.email
                })
            });

            if (response.ok) {
                setIsEditModalOpen(false);
                resetForm();
                fetchMembers();
            } else {
                const err = await response.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error('Update failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Delete Click
    const handleDeleteClick = (member: TeamMember) => {
        setSelectedMember(member);
        setIsDeleteModalOpen(true);
        setActiveDropdown(null);
    };

    // Handle Delete Submit
    const handleDeleteSubmit = async () => {
        if (!selectedMember) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/team?id=${selectedMember.id}&email=${selectedMember.email}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setIsDeleteModalOpen(false);
                resetForm();
                fetchMembers();
            } else {
                const err = await response.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredMembers = activeTab === 'All Members'
        ? members
        : members.filter(m => activeTab === 'Active' ? m.status === 'Active' : m.status === 'Inactive');

    return (
        <div className={`flex h-screen bg-[#09090B] text-iron font-sans overflow-hidden transition-all duration-500 ${isImpersonating ? 'p-1.5' : ''}`} style={isImpersonating ? { backgroundColor: '#0f2b1a' } : undefined}>
            <Sidebar isCollapsed={isSidebarCollapsed} />

            <div className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative">
                <div className={`flex-1 flex flex-col min-w-0 bg-[#121214] rounded-t-2xl overflow-hidden border-t border-l border-r mt-6 mr-6 transition-all duration-500 ${isImpersonating ? 'border-[#22c55e]/60 shadow-[0_0_15px_rgba(34,197,94,0.15),0_0_40px_rgba(34,197,94,0.08),inset_0_0_20px_rgba(34,197,94,0.03)]' : 'border-shark'}`}>
                    <Header
                        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        label="Team"
                        labelIcon={<Users size={16} className="text-santas-gray" />}
                        tabs={memberCategories}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />

                    <main className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="px-6 pb-6 pt-2">
                            <div className="bg-[#18181B] border border-shark rounded-2xl p-6 min-h-[calc(100vh-160px)] shadow-2xl">

                                {/* Toolbar */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="relative w-80">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-santas-gray" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search for Team Members"
                                            className="w-full bg-[#09090B] border border-shark/50 rounded-lg py-2 pl-10 pr-4 text-xs text-iron placeholder:text-storm-gray focus:outline-none focus:border-[#279da6]/40 transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-shark bg-shark/20 text-[11px] font-bold text-santas-gray hover:text-white transition-all">
                                            <Filter size={14} />
                                            <span>Filters</span>
                                        </button>
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#279da6] text-white text-xs font-bold hover:bg-[#279da6]/90 transition-all shadow-lg hover:shadow-[#279da6]/20"
                                        >
                                            <Plus size={14} />
                                            <span>Add Team Member</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Team Members Table */}
                                <div className="border border-shark/60 rounded-xl bg-black/20">
                                    <div className="overflow-visible">
                                        <table className="w-full text-left border-collapse table-auto text-xs">
                                            <thead>
                                                <tr className="border-b border-shark text-storm-gray text-[10px] uppercase font-bold bg-shark/20">
                                                    <th className="px-5 py-4 w-10 border-r border-shark/60"><input type="checkbox" /></th>
                                                    <th className="px-6 py-4 border-r border-shark/60">Name</th>
                                                    <th className="px-6 py-4 border-r border-shark/60">Email</th>
                                                    <th className="px-6 py-4 border-r border-shark/60">Role</th>
                                                    <th className="px-6 py-4 border-r border-shark/60">Requests Managing</th>
                                                    <th className="px-6 py-4 border-r border-shark/60">Last Login</th>
                                                    <th className="px-6 py-4 border-r border-shark/60">Created At</th>
                                                    <th className="px-6 py-4 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-shark/60">
                                                {isLoading ? (
                                                    <tr>
                                                        <td colSpan={8} className="px-6 py-12 text-center text-storm-gray font-medium">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Loader2 size={16} className="animate-spin text-[#279da6]" />
                                                                Loading team members...
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : filteredMembers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className="px-6 py-12 text-center text-storm-gray font-medium uppercase tracking-widest opacity-40">
                                                            No team members found. Add one to get started.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredMembers.map((member) => (
                                                        <tr key={member.id} className="hover:bg-shark/10 transition-colors group">
                                                            <td className="px-5 py-4 border-r border-shark/60"><input type="checkbox" /></td>
                                                            <td className="px-6 py-4 border-r border-shark/60">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-shark flex items-center justify-center text-[10px] font-black text-white overflow-hidden">
                                                                        {member.avatar_url ? (
                                                                            <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            member.name.split(' ').map(n => n[0]).join('')
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-iron text-xs">{member.name}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 border-r border-shark/60 text-storm-gray font-medium">{member.email}</td>
                                                            <td className="px-6 py-4 border-r border-shark/60">
                                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${member.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                                    member.role === 'editor' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                                    }`}>
                                                                    {member.role}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 border-r border-shark/60">
                                                                <div className="flex items-center gap-2">
                                                                    <FileText size={13} className="text-[#279da6]" />
                                                                    <span className="text-iron font-bold text-xs">{member.request_count || 0}</span>
                                                                    <span className="text-storm-gray text-[10px]">requests</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 border-r border-shark/60 text-storm-gray font-medium text-[11px]">{member.last_login}</td>
                                                            <td className="px-6 py-4 border-r border-shark/60 text-storm-gray font-medium text-[11px]">{member.created_at}</td>
                                                            <td className="px-6 py-4 relative">
                                                                <button
                                                                    onClick={() => setActiveDropdown(activeDropdown === member.id ? null : member.id)}
                                                                    className="p-1 hover:bg-shark rounded-md transition-colors text-storm-gray hover:text-white"
                                                                >
                                                                    <MoreHorizontal size={14} />
                                                                </button>

                                                                {activeDropdown === member.id && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                                                                        <div className="absolute right-0 top-8 z-20 bg-[#18181B] border border-shark rounded-lg shadow-2xl py-1.5 w-48 animate-slide-up">
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (member.profile_id) {
                                                                                        impersonate({
                                                                                            id: member.profile_id,
                                                                                            email: member.email,
                                                                                            full_name: member.name,
                                                                                            role: 'team_member'
                                                                                        });
                                                                                        setActiveDropdown(null);
                                                                                    } else {
                                                                                        alert('This team member does not have an account yet.');
                                                                                    }
                                                                                }}
                                                                                className="w-full px-4 py-2 text-left text-xs font-bold text-iron hover:bg-shark/40 transition-colors flex items-center gap-2"
                                                                            >
                                                                                <UserCog size={14} className="text-[#279da6]" />
                                                                                Impersonate
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleEditClick(member)}
                                                                                className="w-full px-4 py-2 text-left text-xs font-bold text-iron hover:bg-shark/40 transition-colors flex items-center gap-2"
                                                                            >
                                                                                <Edit2 size={14} className="text-blue-400" />
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteClick(member)}
                                                                                className="w-full px-4 py-2 text-left text-xs font-bold text-rose-400 hover:bg-shark/40 transition-colors flex items-center gap-2"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}
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

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#18181B] border border-shark rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Create Team Member</h2>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-storm-gray hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-storm-gray mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="w-full bg-[#09090B] border border-shark rounded-lg px-4 py-2.5 text-sm text-iron focus:outline-none focus:border-[#279da6]/40 transition-all"
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-storm-gray mb-2">Email Address *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="w-full bg-[#09090B] border border-shark rounded-lg px-4 py-2.5 text-sm text-iron focus:outline-none focus:border-[#279da6]/40 transition-all"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-storm-gray mb-2">Role *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-[#09090B] border border-shark rounded-lg px-4 py-2.5 text-sm text-iron focus:outline-none focus:border-[#279da6]/40 transition-all"
                                >
                                    <option value="viewer">Viewer — Can view assigned requests</option>
                                    <option value="editor">Editor — Can view & chat on requests</option>
                                    <option value="admin">Admin — Full access to assigned requests</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-storm-gray mb-2">Password (Optional)</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-[#09090B] border border-shark rounded-lg px-4 py-2.5 text-sm text-iron focus:outline-none focus:border-[#279da6]/40 transition-all pr-10"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-storm-gray hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-storm-gray mt-1.5">If provided, a login account will be created</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-storm-gray mb-2">Confirm Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full bg-[#09090B] border border-shark rounded-lg px-4 py-2.5 text-sm text-iron focus:outline-none focus:border-[#279da6]/40 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="px-5 py-2.5 bg-shark/50 hover:bg-shark text-iron rounded-lg font-bold text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 bg-[#279da6] hover:bg-[#279da6]/90 text-white rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[#279da6]/20"
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#18181B] border border-shark rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Edit Team Member</h2>
                            <button onClick={() => { setIsEditModalOpen(false); resetForm(); }} className="text-storm-gray hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-storm-gray mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="w-full bg-[#09090B] border border-shark rounded-lg px-4 py-2.5 text-sm text-iron focus:outline-none focus:border-[#279da6]/40 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-storm-gray mb-2">Email Address *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="w-full bg-[#09090B] border border-shark rounded-lg px-4 py-2.5 text-sm text-iron focus:outline-none focus:border-[#279da6]/40 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-storm-gray mb-2">Role *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-[#09090B] border border-shark rounded-lg px-4 py-2.5 text-sm text-iron focus:outline-none focus:border-[#279da6]/40 transition-all"
                                >
                                    <option value="viewer">Viewer — Can view assigned requests</option>
                                    <option value="editor">Editor — Can view & chat on requests</option>
                                    <option value="admin">Admin — Full access to assigned requests</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-storm-gray mb-2">New Password (Leave blank to keep current)</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-[#09090B] border border-shark rounded-lg px-4 py-2.5 text-sm text-iron focus:outline-none focus:border-[#279da6]/40 transition-all pr-10"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-storm-gray hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-storm-gray mb-2">Confirm Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full bg-[#09090B] border border-shark rounded-lg px-4 py-2.5 text-sm text-iron focus:outline-none focus:border-[#279da6]/40 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsEditModalOpen(false); resetForm(); }}
                                    className="px-5 py-2.5 bg-shark/50 hover:bg-shark text-iron rounded-lg font-bold text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 bg-[#279da6] hover:bg-[#279da6]/90 text-white rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[#279da6]/20"
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Update Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#18181B] border border-shark rounded-3xl p-8 max-w-md w-full shadow-2xl animate-slide-up">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <AlertTriangle size={24} />
                            </div>
                            <button onClick={() => { setIsDeleteModalOpen(false); resetForm(); }} className="text-storm-gray hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-iron mb-2">Delete Team Member?</h2>
                        <p className="text-storm-gray text-sm mb-8">
                            Are you sure you want to delete <strong className="text-white">{selectedMember.name}</strong>?
                            This will also delete their account and cannot be undone.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleDeleteSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete Member'}
                            </button>
                            <button
                                onClick={() => { setIsDeleteModalOpen(false); resetForm(); }}
                                disabled={isSubmitting}
                                className="w-full bg-shark/50 hover:bg-shark text-iron py-3 rounded-xl font-bold text-sm transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
