'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
    ChevronLeft,
    MoreHorizontal,
    Send,
    Paperclip,
    Calendar,
    User,
    Tag,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Clock,
    MessageSquare,
    Loader2,
    ListFilter,
    Bold,
    Italic,
    Underline,
    List,
    Link as LinkIcon,
    Smile,
    Plus,
    X,
    UserPlus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import ImpersonationWarning from '@/components/ImpersonationWarning';

interface Message {
    id: string;
    request_id: string;
    sender_id: string;
    message: string;
    attachments: any[];
    is_read: boolean;
    created_at: string;
    sender: {
        full_name: string;
        role: string;
        avatar_url?: string | null;
    };
}

interface RequestDetails {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    due_date: string | null;
    client: {
        id: string;
        full_name: string;
        email: string;
        organization?: string;
    } | null;
    assignee: {
        id: string;
        full_name: string;
    } | null;
    service: string | null;
    start_date: string | null;
    time_estimate: string | null;
    tags: string[];
    assigned_to: string | null;
    request_number?: number;
}

interface Profile {
    id: string;
    full_name: string;
    avatar_url: string | null;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
    department: string | null;
    position: string | null;
    profile_id: string | null;
    avatar_url: string | null;
}

interface Assignment {
    id: string;
    request_id: string;
    team_member_id: string;
    role: 'admin' | 'editor' | 'viewer';
    assigned_at: string;
    team_member: TeamMember;
}

export default function RequestDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { profile, viewAsProfile, isImpersonating } = useAuth();
    const displayProfile = viewAsProfile || profile;
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [request, setRequest] = useState<RequestDetails | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isOnline, setIsOnline] = useState(true); // Mock status
    const [isUploading, setIsUploading] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
    const [isAssigning, setIsAssigning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    // WYSIWYG formatting helpers
    const execFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        // Sync state for send button disabled check
        handleEditorInput();
    };

    const handleInsertLink = () => {
        const url = prompt('Enter URL:');
        if (url) {
            document.execCommand('createLink', false, url);
            editorRef.current?.focus();
            handleEditorInput();
        }
    };

    const handleEditorInput = () => {
        const text = editorRef.current?.textContent?.trim() || '';
        setNewMessage(text); // Keep in sync for disabled state checks
    };

    // Check if a message is HTML (new format) vs plain text (old format)
    const isHtmlContent = (text: string) => /<[a-z][\s\S]*>/i.test(text);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (id) {
            const initPage = async () => {
                setIsLoading(true);
                try {
                    await Promise.all([
                        fetchRequestDetails(),
                        fetchMessages(),
                        fetchAssignments(),
                        fetchTeamMembers()
                    ]);
                } finally {
                    setIsLoading(false);
                }
            };

            initPage();

            // Subscribe to real-time messages
            const channel = supabase
                .channel(`request_messages:${id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'request_messages',
                        filter: `request_id=eq.${id}`,
                    },
                    (payload) => {
                        const newMsg = payload.new as Message;
                        setMessages(prev => {
                            // Check if message already exists (e.g., from optimistic update)
                            if (prev.some(m => m.id === newMsg.id)) return prev;

                            // If it's from another user, we need to fetch details or wait for re-fetch
                            // To keep it clean and truly real-time, we'll trigger a re-fetch of sender info
                            // if it's not the current user's message.
                            if (newMsg.sender_id !== profile?.id) {
                                fetchMessages();
                            }
                            return prev;
                        });
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchRequestDetails = async () => {
        try {
            const response = await fetch(`/api/requests?id=${id}`);
            const data = await response.json();
            if (response.ok) {
                const found = Array.isArray(data) ? data.find((r: any) => r.id === id) : data;

                // ACCESS CONTROL for Team Members
                const isTeamMember = displayProfile?.role === 'team_member';
                const isTeamAdmin = displayProfile?.team_role === 'admin';
                if (found && isTeamMember && !isTeamAdmin && found.assigned_to !== displayProfile?.id) {
                    router.push('/requests');
                    return;
                }

                setRequest(found);
            }

            // Fetch team members for assignment dropdown
            const teamRes = await fetch('/api/team');
            if (teamRes.ok) {
                const teamData = await teamRes.json();
                setTeamMembers(teamData);
            }
        } catch (error) {
            console.error('Error fetching request details:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await fetch(`/api/requests/${id}/messages`);
            const data = await response.json();
            if (response.ok) {
                setMessages(data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchAssignments = async () => {
        try {
            const response = await fetch(`/api/requests/${id}/assignments`);
            if (response.ok) {
                const data = await response.json();
                setAssignments(data);
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const response = await fetch('/api/team');
            if (response.ok) {
                const data = await response.json();
                setTeamMembers(data);
            }
        } catch (error) {
            console.error('Error fetching team members:', error);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent, attachments: any[] = []) => {
        if (e) e.preventDefault();
        const editorHtml = editorRef.current?.innerHTML || '';
        const textContent = editorRef.current?.textContent?.trim() || '';

        if ((!textContent && attachments.length === 0) || !displayProfile || isSending) return;

        // Use HTML content for the message (preserves formatting)
        const messageContent = textContent ? editorHtml : '';
        setIsSending(true);
        setNewMessage('');
        if (editorRef.current) editorRef.current.innerHTML = '';

        // Optimistic message
        const optimisticId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            id: optimisticId,
            request_id: id as string,
            sender_id: displayProfile.id,
            message: messageContent,
            attachments: attachments,
            is_read: false,
            created_at: new Date().toISOString(),
            sender: {
                full_name: displayProfile.full_name || 'You',
                role: displayProfile.role || 'user'
            }
        };

        // Add to local state immediately
        setMessages(prev => [...prev, tempMessage]);

        try {
            const response = await fetch(`/api/requests/${id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageContent,
                    sender_id: displayProfile.id,
                    attachments
                })
            });

            if (!response.ok) {
                // Remove optimistic message on error
                setMessages(prev => prev.filter(m => m.id !== optimisticId));
                if (editorRef.current) editorRef.current.innerHTML = messageContent;
                setNewMessage(textContent);
            } else {
                const finalMsg = await response.json();
                // Replace temp message with server message
                setMessages(prev => prev.map(m => m.id === optimisticId ? finalMsg : m));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
            if (editorRef.current) editorRef.current.innerHTML = messageContent;
            setNewMessage(textContent);
        } finally {
            setIsSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !displayProfile) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('requestId', id as string);

        try {
            // We'll assume a local upload API point or Supabase storage
            // Implementation for now using a mock-ready upload endpoint
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const { url, name, type } = await response.json();
                // Send a special message with the attachment
                handleSendMessage(undefined, [{ url, name, type }]);
            } else {
                alert("Upload failed");
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert("Error uploading file");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUpdateField = async (field: string, value: any) => {
        if (!request) return;

        // Optimistic update
        const originalRequest = { ...request };
        const newRequest = { ...request, [field]: value };

        // Handle nested assignee update logic for UI
        if (field === 'assigned_to') {
            const newAssignee = profiles.find(p => p.id === value);
            newRequest.assignee = newAssignee || null;
        }

        setRequest(newRequest);

        try {
            const response = await fetch(`/api/requests?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });

            if (!response.ok) {
                setRequest(originalRequest);
                alert(`Failed to update ${field}`);
            }
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            setRequest(originalRequest);
        }
    };

    const handleAddTag = async () => {
        if (!request || !newTag.trim()) return;
        const updatedTags = [...(request.tags || []), newTag.trim()];
        setNewTag('');
        setIsAddingTag(false);
        handleUpdateField('tags', updatedTags);
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        if (!request) return;
        const updatedTags = request.tags.filter(t => t !== tagToRemove);
        handleUpdateField('tags', updatedTags);
    };

    const handleAssignTeamMember = async (teamMemberId: string) => {
        setIsAssigning(true);
        try {
            const response = await fetch(`/api/requests/${id}/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    team_member_id: teamMemberId,
                    role: selectedRole,
                    assigned_by: profile?.id
                })
            });
            if (response.ok) {
                setIsAssignmentModalOpen(false);
                setSelectedRole('viewer');
                fetchAssignments();
            } else {
                const err = await response.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error('Assignment failed:', error);
        } finally {
            setIsAssigning(false);
        }
    };

    const handleRemoveAssignment = async (assignmentId: string) => {
        try {
            const response = await fetch(`/api/requests/${id}/assignments?assignment_id=${assignmentId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchAssignments();
            }
        } catch (error) {
            console.error('Remove assignment failed:', error);
        }
    };

    const handleUpdateAssignmentRole = async (assignmentId: string, newRole: string) => {
        try {
            const response = await fetch(`/api/requests/${id}/assignments`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignment_id: assignmentId, role: newRole })
            });
            if (response.ok) {
                fetchAssignments();
            }
        } catch (error) {
            console.error('Update role failed:', error);
        }
    };

    const unassignedTeamMembers = teamMembers.filter(
        tm => !assignments.some(a => a.team_member_id === tm.id)
    );

    if (isLoading && !request) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#09090B]">
                <Loader2 size={32} className="animate-spin text-[#279da6]" />
            </div>
        );
    }

    if (!request) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#09090B] text-iron">
                <div className="text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 text-rose-500 opacity-50" />
                    <p className="font-bold">Request not found</p>
                    <button onClick={() => router.push('/requests')} className="mt-4 text-[#279da6] hover:underline">Return to list</button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`flex h-screen bg-[#09090B] text-iron font-sans overflow-hidden transition-all duration-500 ${isImpersonating ? 'p-1.5' : ''}`} style={isImpersonating ? { backgroundColor: '#0f2b1a' } : undefined}>
                <Sidebar isCollapsed={isSidebarCollapsed} />

                <div className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative">
                    <div className={`flex-1 flex flex-col min-w-0 bg-[#121214] rounded-t-2xl overflow-hidden border-t border-l border-r mt-6 mr-6 transition-all duration-500 ${isImpersonating ? 'border-[#22c55e]/60 shadow-[0_0_15px_rgba(34,197,94,0.15),0_0_40px_rgba(34,197,94,0.08),inset_0_0_20px_rgba(34,197,94,0.03)]' : 'border-shark'}`}>

                        {/* Header */}
                        <div className="h-16 border-b border-shark flex items-center justify-between px-6 bg-shark/5">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => router.push('/requests')}
                                    className="p-2 hover:bg-shark rounded-lg text-santas-gray hover:text-white transition-all"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-[#279da6] bg-shark/40 py-1 px-2.5 rounded-lg border border-[#279da6]/20 shadow-sm">
                                        #{request.request_number || 1}
                                    </span>
                                    <div className="flex flex-col justify-center">
                                        <h1 className="text-sm font-bold text-iron leading-tight">{request.title}</h1>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500'}`} />
                                            <span className="text-[8px] text-storm-gray font-black uppercase tracking-[0.2em] opacity-70">
                                                {isOnline ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <ImpersonationWarning />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="p-2 hover:bg-shark rounded-full text-santas-gray hover:text-white transition-all">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Main Content Area */}
                            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#09090B]/30">

                                {/* Request Body */}
                                <div className="p-8 max-w-4xl mx-auto w-full">
                                    <div className="mb-8">
                                        <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">{request.title}</h2>

                                        <div className="flex items-start gap-4 mb-8">
                                            <div className="w-10 h-10 rounded-full bg-shark flex items-center justify-center text-[#279da6] shrink-0 border border-white/5 shadow-inner">
                                                <MessageSquare size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-shark/20 border border-shark/50 rounded-2xl p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-[11px] font-black text-[#279da6] uppercase tracking-widest">Request Submitted</span>
                                                        <span className="text-[10px] text-storm-gray font-bold">
                                                            {new Date(request.created_at).toLocaleString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <p className="text-iron text-sm leading-relaxed whitespace-pre-wrap">
                                                        {request.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline Splitter */}
                                        <div className="relative flex items-center justify-center my-12">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-shark/40"></div>
                                            </div>
                                            <span className="relative px-4 py-1.5 bg-[#121214] border border-shark rounded-full text-[9px] font-black text-storm-gray uppercase tracking-[0.2em] shadow-2xl">
                                                Discussion Started
                                            </span>
                                        </div>

                                        {/* Messages Timeline */}
                                        <div className="space-y-8">
                                            {messages.map((msg) => {
                                                const isMe = msg.sender_id === profile?.id;
                                                return (
                                                    <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/5 shadow-lg relative overflow-hidden ${isMe ? 'bg-[#279da6] text-white' : 'bg-shark text-[#279da6]'
                                                            }`}>
                                                            {isMe ? (
                                                                profile?.avatar_url ? (
                                                                    <Image
                                                                        src={profile.avatar_url}
                                                                        alt={profile.full_name || 'User'}
                                                                        fill
                                                                        unoptimized
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    <span className="font-black text-xs">{profile?.full_name?.split(' ').map(n => n[0]).join('')}</span>
                                                                )
                                                            ) : (
                                                                msg.sender?.avatar_url ? (
                                                                    <Image
                                                                        src={msg.sender.avatar_url}
                                                                        alt={msg.sender.full_name || 'User'}
                                                                        fill
                                                                        unoptimized
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    <span className="font-black text-xs">{msg.sender?.full_name?.split(' ').map(n => n[0]).join('')}</span>
                                                                )
                                                            )}
                                                        </div>
                                                        <div className={`max-w-[80%] ${isMe ? 'text-right' : ''}`}>
                                                            <div className="flex items-center gap-2 mb-1.5 px-1">
                                                                <span className="text-[11px] font-black text-iron uppercase tracking-widest">
                                                                    {isMe ? 'You' : msg.sender?.full_name}
                                                                </span>
                                                                <span className="text-[9px] text-storm-gray font-bold">
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-lg ${isMe
                                                                ? 'bg-[#279da6] text-white rounded-tr-none'
                                                                : 'bg-shark text-iron rounded-tl-none border border-white/5'
                                                                }`}>
                                                                {/* Rich text message renderer — supports HTML (new) and plain text with markdown (old) */}
                                                                {isHtmlContent(msg.message) ? (
                                                                    <div
                                                                        className="prose prose-sm prose-invert max-w-none [&_a]:text-[#279da6] [&_a]:underline [&_a]:font-bold"
                                                                        dangerouslySetInnerHTML={{ __html: msg.message }}
                                                                    />
                                                                ) : (
                                                                    msg.message.split('\n').map((line, i) => (
                                                                        <div key={i}>
                                                                            {line.split(/(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|https?:\/\/[^\s]+)/).map((part, j) => {
                                                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                                                    return <strong key={j}>{part.slice(2, -2)}</strong>;
                                                                                }
                                                                                if (part.startsWith('__') && part.endsWith('__')) {
                                                                                    return <u key={j}>{part.slice(2, -2)}</u>;
                                                                                }
                                                                                if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                                                                                    return <em key={j}>{part.slice(1, -1)}</em>;
                                                                                }
                                                                                if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
                                                                                    return <em key={j}>{part.slice(1, -1)}</em>;
                                                                                }
                                                                                if (/^https?:\/\/[^\s]+$/.test(part)) {
                                                                                    return <a key={j} href={part} target="_blank" rel="noopener noreferrer" className={`underline font-bold ${isMe ? 'text-white/90' : 'text-[#279da6]'}`}>{part}</a>;
                                                                                }
                                                                                return part;
                                                                            })}
                                                                        </div>
                                                                    ))
                                                                )}
                                                                {msg.attachments && msg.attachments.length > 0 && (
                                                                    <div className="mt-3 space-y-2">
                                                                        {msg.attachments.map((at, idx) => (
                                                                            <a
                                                                                key={idx}
                                                                                href={at.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="block group/at"
                                                                            >
                                                                                {at.type?.startsWith('image/') ? (
                                                                                    <div className="relative rounded-lg overflow-hidden border border-white/10 shadow-lg max-w-[240px]">
                                                                                        <img src={at.url} alt={at.name} className="w-full h-auto" />
                                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/at:opacity-100 transition-opacity flex items-center justify-center">
                                                                                            <span className="text-[10px] font-black uppercase text-white">View Full Image</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 transition-all max-w-[280px]">
                                                                                        <Paperclip size={18} className="text-[#279da6]" />
                                                                                        <div className="min-w-0">
                                                                                            <p className="text-xs font-bold truncate text-white">{at.name}</p>
                                                                                            <p className="text-[10px] text-storm-gray font-bold uppercase tracking-widest">Download File</p>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>
                                </div>

                                {/* Message Composer - Fixed to bottom of main area */}
                                <div className="mt-auto p-6 bg-[#121214] border-t border-shark shadow-[0_-8px_24px_rgba(0,0,0,0.2)]">
                                    <div className="max-w-4xl mx-auto">
                                        <div className="bg-shark/30 border border-shark/60 rounded-2xl overflow-hidden shadow-inner focus-within:border-[#279da6]/50 transition-all">
                                            {/* Formatting Bar */}
                                            <div className="flex items-center gap-1 p-2 bg-shark/20 border-b border-shark/40">
                                                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('bold')} title="Bold" className="p-1.5 hover:bg-shark rounded text-storm-gray hover:text-white transition-all"><Bold size={14} /></button>
                                                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('italic')} title="Italic" className="p-1.5 hover:bg-shark rounded text-storm-gray hover:text-white transition-all"><Italic size={14} /></button>
                                                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('underline')} title="Underline" className="p-1.5 hover:bg-shark rounded text-storm-gray hover:text-white transition-all"><Underline size={14} /></button>
                                                <div className="w-px h-4 bg-shark mx-1"></div>
                                                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execFormat('insertUnorderedList')} title="List" className="p-1.5 hover:bg-shark rounded text-storm-gray hover:text-white transition-all"><List size={14} /></button>
                                                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleInsertLink} title="Insert Link" className="p-1.5 hover:bg-shark rounded text-storm-gray hover:text-white transition-all"><LinkIcon size={14} /></button>
                                                <div className="flex-1"></div>
                                                <button type="button" className="p-1.5 hover:bg-shark rounded text-storm-gray hover:text-white transition-all"><Smile size={14} /></button>
                                            </div>
                                            <div
                                                ref={editorRef}
                                                contentEditable
                                                suppressContentEditableWarning
                                                onInput={handleEditorInput}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }}
                                                data-placeholder="Write your message here..."
                                                className="w-full bg-transparent text-iron p-4 text-sm focus:outline-none min-h-[120px] empty:before:content-[attr(data-placeholder)] empty:before:text-storm-gray empty:before:pointer-events-none [&_a]:text-[#279da6] [&_a]:underline"
                                            />
                                            <div className="flex items-center justify-between p-3 bg-shark/10">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    onChange={handleFileUpload}
                                                />
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploading}
                                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-santas-gray hover:text-white transition-all group"
                                                >
                                                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} className="group-hover:text-[#279da6]" />}
                                                    <span>{isUploading ? 'Uploading...' : 'Attach Files'}</span>
                                                </button>
                                                <button
                                                    onClick={() => handleSendMessage()}
                                                    disabled={isSending || !newMessage.trim()}
                                                    className="bg-[#279da6] hover:bg-[#20838b] text-white px-6 py-2 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-40 shadow-lg shadow-[#279da6]/20 active:scale-95"
                                                >
                                                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Send Message</>}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-center gap-6">
                                            <span className="text-[10px] text-storm-gray font-black uppercase tracking-widest opacity-50">Press Enter to Send</span>
                                            <span className="text-[10px] text-storm-gray font-black uppercase tracking-widest opacity-50">Shift + Enter for new line</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Sidebar - Summary */}
                            <div className="w-[340px] border-l border-shark bg-[#121214] flex flex-col p-6 overflow-y-auto custom-scrollbar">
                                <h3 className="text-lg font-bold text-white mb-8">Summary</h3>

                                <div className="space-y-8">
                                    {/* Base Info */}
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">{request.title}</h4>
                                        <div className="text-[12px] text-storm-gray">
                                            <span className="font-bold">Created:</span> {new Date(request.created_at).toLocaleString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-[12px] font-bold text-storm-gray">Client:</span>
                                            <div className="flex items-center gap-2.5 bg-shark/20 py-1.5 px-3 rounded-xl border border-white/5 hover:bg-shark/30 cursor-pointer transition-all">
                                                <div className="w-7 h-7 rounded-full bg-shark flex items-center justify-center text-[10px] text-[#279da6] font-black shrink-0 border border-white/5 shadow-inner">
                                                    {request.client?.full_name?.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="min-w-0 pr-1">
                                                    <p className="text-[11px] font-bold text-iron leading-tight truncate">{request.client?.full_name}</p>
                                                    {request.client?.organization && (
                                                        <p className="text-[9px] text-storm-gray font-bold truncate opacity-80">{request.client.organization}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-bold text-storm-gray w-20">Status</span>
                                            <select
                                                value={request.status}
                                                onChange={(e) => handleUpdateField('status', e.target.value)}
                                                className="flex-1 bg-shark/30 text-iron border border-shark/60 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-shark/50 focus:outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="Todo">Todo</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Review">Review</option>
                                                <option value="Done">Done</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-bold text-storm-gray w-20">Priority</span>
                                            <div className="flex-1 relative">
                                                <select
                                                    value={request.priority}
                                                    onChange={(e) => handleUpdateField('priority', e.target.value)}
                                                    className={`w-full bg-shark/20 border border-shark/40 pl-5 pr-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer hover:bg-shark/30 transition-all appearance-none ${request.priority === 'Critical' ? 'text-rose-500' :
                                                        request.priority === 'High' ? 'text-amber-500' :
                                                            request.priority === 'Medium' ? 'text-blue-400' :
                                                                'text-storm-gray'
                                                        }`}
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                    <option value="Critical">Critical</option>
                                                </select>
                                                <div className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full ${request.priority === 'Critical' ? 'bg-rose-500' :
                                                    request.priority === 'High' ? 'bg-amber-500' :
                                                        request.priority === 'Medium' ? 'bg-blue-400' :
                                                            'bg-storm-gray'
                                                    }`} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-bold text-storm-gray w-20">Assigned To</span>
                                            <div className="flex-1 flex items-center gap-2">
                                                <select
                                                    value={request.assigned_to || ''}
                                                    onChange={(e) => handleUpdateField('assigned_to', e.target.value)}
                                                    className="flex-1 bg-transparent text-[11px] font-bold text-iron focus:outline-none cursor-pointer hover:text-white transition-all appearance-none"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {teamMembers.filter((tm: any) => tm.profile_id).map((tm: any) => (
                                                        <option key={tm.id} value={tm.profile_id}>{tm.name}</option>
                                                    ))}
                                                </select>
                                                <div className="w-6 h-6 rounded-full bg-shark/40 border border-shark flex items-center justify-center text-storm-gray overflow-hidden">
                                                    {request.assignee ? (
                                                        <div className="w-full h-full bg-[#279da6] text-white flex items-center justify-center text-[10px] font-black">
                                                            {request.assignee.full_name?.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                    ) : (
                                                        <Plus size={14} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-bold text-storm-gray w-20">Due Date</span>
                                            <div className="flex-1 flex items-center justify-end gap-2 text-[11px] font-black text-iron">
                                                <input
                                                    ref={dateInputRef}
                                                    type="date"
                                                    value={request.due_date ? new Date(request.due_date).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => handleUpdateField('due_date', e.target.value)}
                                                    className="bg-transparent text-iron border-none focus:outline-none text-right cursor-pointer hover:text-white transition-all uppercase"
                                                />
                                                <Calendar
                                                    size={14}
                                                    className="text-storm-gray cursor-pointer hover:text-white transition-all"
                                                    onClick={() => dateInputRef.current?.showPicker()}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Team Assignments */}
                                    <div className="pt-6 border-t border-shark">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-storm-gray">Team Members</h4>
                                            <button
                                                onClick={() => setIsAssignmentModalOpen(true)}
                                                className="p-1 hover:bg-shark rounded-md text-storm-gray hover:text-[#279da6] transition-colors"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        {assignments.length === 0 ? (
                                            <p className="text-[11px] text-storm-gray/50 italic">No team members assigned.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {assignments.map(a => (
                                                    <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-shark/20 border border-shark/40 group hover:border-shark transition-all">
                                                        <div className="w-7 h-7 rounded-full bg-shark flex items-center justify-center text-[9px] font-black text-[#279da6] shrink-0 overflow-hidden">
                                                            {a.team_member.avatar_url ? (
                                                                <img src={a.team_member.avatar_url} alt={a.team_member.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                a.team_member.name.split(' ').map(n => n[0]).join('')
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] font-bold text-iron truncate">{a.team_member.name}</p>
                                                            <select
                                                                value={a.role}
                                                                onChange={(e) => handleUpdateAssignmentRole(a.id, e.target.value)}
                                                                className="bg-transparent text-[9px] font-black uppercase tracking-widest text-[#279da6] cursor-pointer focus:outline-none appearance-none"
                                                            >
                                                                <option value="viewer">Viewer</option>
                                                                <option value="editor">Editor</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveAssignment(a.id)}
                                                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 rounded text-rose-400 transition-all"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 border-t border-shark mt-auto">
                                        <button className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 border border-rose-500/10 transition-all font-black text-[10px] uppercase tracking-widest group">
                                            <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                                            Delete Request
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* Assignment Modal */}
            {
                isAssignmentModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="bg-[#18181B] border border-shark rounded-3xl p-6 max-w-md w-full shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-black text-white uppercase tracking-tight">Assign Team Member</h2>
                                <button onClick={() => setIsAssignmentModalOpen(false)} className="text-storm-gray hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="mb-4">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-storm-gray mb-2">Role</label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'editor' | 'viewer')}
                                    className="w-full bg-[#09090B] border border-shark rounded-lg px-4 py-2.5 text-sm text-iron focus:outline-none focus:border-[#279da6]/40 transition-all"
                                >
                                    <option value="viewer">Viewer - Can view request</option>
                                    <option value="editor">Editor - Can view & chat</option>
                                    <option value="admin">Admin - Full access</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                {unassignedTeamMembers.length === 0 ? (
                                    <p className="text-sm text-storm-gray text-center py-4">All team members are already assigned.</p>
                                ) : (
                                    unassignedTeamMembers.map(tm => (
                                        <button
                                            key={tm.id}
                                            onClick={() => handleAssignTeamMember(tm.id)}
                                            disabled={isAssigning}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-shark/20 border border-shark/40 hover:border-[#279da6]/40 hover:bg-shark/30 transition-all text-left"
                                        >
                                            <div className="w-9 h-9 rounded-full bg-shark flex items-center justify-center text-[10px] font-black text-[#279da6] shrink-0 overflow-hidden">
                                                {tm.avatar_url ? (
                                                    <img src={tm.avatar_url} alt={tm.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    tm.name.split(' ').map(n => n[0]).join('')
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-iron">{tm.name}</p>
                                                <p className="text-[10px] text-storm-gray truncate">{tm.email}</p>
                                            </div>
                                            <UserPlus size={14} className="text-[#279da6] shrink-0" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
        </>
    );
}
