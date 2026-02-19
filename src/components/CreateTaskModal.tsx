'use client';

import React, { useState } from 'react';
import { X, Send, User, Calendar, Flag, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (task: any) => void;
    profiles: any[];
    teamMembers: any[];
    requests: any[];
}

export default function CreateTaskModal({ isOpen, onClose, onSuccess, profiles, teamMembers, requests }: CreateTaskModalProps) {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        assigned_to: '',
        due_date: '',
        request_ids: [] as string[]
    });
    const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>('');
    const [suggestedRequests, setSuggestedRequests] = useState<any[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    React.useEffect(() => {
        if (!selectedTeamMemberId || !isOpen) {
            setSuggestedRequests([]);
            setIsLoadingSuggestions(false);
            return;
        }

        const fetchAutoRequests = async () => {
            setIsLoadingSuggestions(true);
            try {
                const response = await fetch(`/api/team-members/${selectedTeamMemberId}/assigned-requests`);
                if (response.ok) {
                    const assignedRequestIds = await response.json();
                    const matchedRequests = requests.filter(r => assignedRequestIds.includes(r.id));
                    setSuggestedRequests(matchedRequests);
                }
            } catch (error) {
                console.error('Auto-selection error:', error);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };

        fetchAutoRequests();
    }, [selectedTeamMemberId, isOpen, requests]);

    if (!isOpen) return null;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    created_by: user?.id,
                    status: 'Todo'
                })
            });

            if (!response.ok) throw new Error('Failed to create task');
            const newTask = await response.json();

            // Find details for UI update
            const tm = teamMembers.find(t => t.profile_id === formData.assigned_to);
            const p = profiles.find(pr => pr.id === formData.assigned_to);
            const assignee = tm ? { id: tm.profile_id, full_name: tm.name } : (p ? { id: p.id, full_name: p.full_name || p.email } : null);

            const selectedRequests = requests.filter(r => formData.request_ids.includes(r.id));

            // For backward compatibility or single display, we might still send first request info
            // but the system is now multi-link capable in the backend.
            onSuccess({ ...newTask, assignee, request_links: selectedRequests.map(r => ({ request: r })) });
            onClose();
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Failed to create task. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Prepare the list of assignees: Only show official team members
    const assignees = teamMembers.map(tm => ({
        tmId: tm.id,          // team_members.id — always present
        profileId: tm.profile_id || '', // may be null
        name: tm.name || tm.full_name || 'Team Member'
    }));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#18181B] border border-shark/60 rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden animate-slide-up">
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#279da6] via-[#279da6]/60 to-[#279da6]" />

                <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Create Team Task</h2>
                            <p className="text-storm-gray text-xs font-bold uppercase tracking-widest mt-1">Internal work assignment</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-storm-gray hover:text-white hover:bg-shark/40 rounded-xl transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-storm-gray uppercase tracking-widest ml-1">Task Title</label>
                            <input
                                required
                                type="text"
                                placeholder="What needs to be done?"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-black/40 border border-shark rounded-2xl p-4 text-iron placeholder:text-storm-gray focus:border-[#279da6]/50 focus:outline-none transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-storm-gray uppercase tracking-widest ml-1">Description (Optional)</label>
                            <textarea
                                rows={3}
                                placeholder="Add more details about this task..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-black/40 border border-shark rounded-2xl p-4 text-iron placeholder:text-storm-gray focus:border-[#279da6]/50 focus:outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Assisnee */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-storm-gray uppercase tracking-widest ml-1">Assign To</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-storm-gray z-10" size={16} />
                                    <select
                                        value={selectedTeamMemberId}
                                        onChange={e => {
                                            const tmId = e.target.value;
                                            const tm = assignees.find(a => a.tmId === tmId);
                                            setSelectedTeamMemberId(tmId);
                                            setFormData(prev => ({ ...prev, assigned_to: tm?.profileId || '' }));
                                            setSuggestedRequests([]);
                                        }}
                                        className="w-full bg-[#09090B] border border-shark rounded-2xl p-4 pl-12 pr-10 !text-white appearance-none focus:border-[#279da6]/50 focus:outline-none transition-all cursor-pointer [color-scheme:dark] relative z-0"
                                    >
                                        <option value="" className="bg-[#18181B] !text-white">Unassigned</option>
                                        {assignees.map(a => (
                                            <option key={a.tmId} value={a.tmId} className="bg-[#18181B] !text-white">
                                                {a.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-storm-gray">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-storm-gray uppercase tracking-widest ml-1">Priority Level</label>
                                <div className="relative">
                                    <Flag className="absolute left-4 top-1/2 -translate-y-1/2 text-storm-gray z-10" size={16} />
                                    <select
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full bg-[#09090B] border border-shark rounded-2xl p-4 pl-12 pr-10 !text-white appearance-none focus:border-[#279da6]/50 focus:outline-none transition-all cursor-pointer [color-scheme:dark] relative z-0"
                                    >
                                        {['Low', 'Medium', 'High', 'Critical'].map(p => (
                                            <option key={p} value={p} className="bg-[#18181B] !text-white">{p}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-storm-gray">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Request & Due Date Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Link to Request */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-storm-gray uppercase tracking-widest ml-1">Link to Request(s) (Optional)</label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 text-storm-gray z-10" size={16} />
                                        <select
                                            value=""
                                            onChange={e => {
                                                if (e.target.value) {
                                                    const id = e.target.value;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        request_ids: prev.request_ids.includes(id)
                                                            ? prev.request_ids
                                                            : [...prev.request_ids, id]
                                                    }));
                                                }
                                            }}
                                            className="w-full bg-[#09090B] border border-shark rounded-2xl p-4 pl-12 pr-10 !text-white appearance-none focus:border-[#279da6]/50 focus:outline-none transition-all cursor-pointer [color-scheme:dark] relative z-0"
                                        >
                                            <option value="" className="bg-[#18181B] !text-white">Add Request Link...</option>
                                            {requests.filter(r => !formData.request_ids.includes(r.id)).map(r => (
                                                <option key={r.id} value={r.id} className="bg-[#18181B] !text-white">
                                                    {r.title}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-storm-gray">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>

                                    {/* Suggested Requests Section — shown whenever a team member is selected */}
                                    {selectedTeamMemberId && (
                                        <div className="bg-shark/10 border border-shark/40 rounded-xl p-3 space-y-2">
                                            <p className="text-[9px] font-black text-storm-gray uppercase tracking-widest px-1">Suggested from Assignee</p>
                                            {isLoadingSuggestions ? (
                                                <div className="flex items-center gap-2 px-1">
                                                    <Loader2 size={12} className="animate-spin text-storm-gray" />
                                                    <span className="text-[10px] text-storm-gray font-bold">Loading requests...</span>
                                                </div>
                                            ) : suggestedRequests.filter(r => !formData.request_ids.includes(r.id)).length === 0 ? (
                                                <p className="text-[10px] text-storm-gray/60 italic px-1">No assigned requests found for this member.</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {suggestedRequests
                                                        .filter(r => !formData.request_ids.includes(r.id))
                                                        .map(r => (
                                                            <button
                                                                key={r.id}
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({
                                                                    ...prev,
                                                                    request_ids: [...prev.request_ids, r.id]
                                                                }))}
                                                                className="text-[10px] bg-shark/40 hover:bg-[#279da6]/20 border border-shark/60 hover:border-[#279da6]/40 text-iron hover:text-[#279da6] px-2 py-1 rounded-lg transition-all font-bold truncate max-w-[200px]"
                                                            >
                                                                + {r.title}
                                                            </button>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Selected Requests Pills */}
                                    {formData.request_ids.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {formData.request_ids.map(rid => {
                                                const req = requests.find(r => r.id === rid);
                                                return (
                                                    <div key={rid} className="flex items-center gap-2 bg-[#279da6]/10 border border-[#279da6]/30 rounded-lg px-2 py-1">
                                                        <span className="text-[10px] font-bold text-[#279da6] truncate max-w-[150px]">
                                                            {req ? req.title : 'Loading...'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, request_ids: prev.request_ids.filter(id => id !== rid) }))}
                                                            className="text-storm-gray hover:text-white transition-colors"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-storm-gray uppercase tracking-widest ml-1">Due Date (Optional)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-storm-gray" size={16} />
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                        className="w-full bg-black/40 border border-shark rounded-2xl p-4 pl-12 text-iron focus:border-[#279da6]/50 focus:outline-none transition-all [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.title}
                            className={`w-full py-4 rounded-2xl bg-[#279da6] text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[#279da6]/20 ${isSubmitting || !formData.title ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /><span>Create Task</span></>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
