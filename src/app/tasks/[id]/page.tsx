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
    Trash2,
    AlertCircle,
    CheckCircle2,
    Clock,
    MessageSquare,
    Loader2,
    Bold,
    Italic,
    Underline,
    List,
    Link as LinkIcon,
    Smile,
    Plus,
    X,
    CircleDashed,
    RefreshCcw,
    Flag
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import ImpersonationWarning from '@/components/ImpersonationWarning';

interface Message {
    id: string;
    task_id: string;
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

interface TaskDetails {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    due_date: string | null;
    assigned_to: string | null;
    created_by: string | null;
    assignee: {
        id: string;
        full_name: string;
    } | null;
    creator: {
        id: string;
        full_name: string;
    } | null;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
    profile_id: string | null;
    avatar_url: string | null;
}

export default function TaskDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { profile, viewAsProfile, isImpersonating } = useAuth();
    const displayProfile = viewAsProfile || profile;
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [task, setTask] = useState<TaskDetails | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    // Delete state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // WYSIWYG formatting
    const execFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
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
        setNewMessage(text);
    };

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
                        fetchTaskDetails(),
                        fetchMessages(),
                        fetchTeamMembers()
                    ]);
                } finally {
                    setIsLoading(false);
                }
            };

            initPage();

            // Subscribe to real-time messages
            const channel = supabase
                .channel(`task_messages:${id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'task_messages',
                        filter: `task_id=eq.${id}`,
                    },
                    (payload) => {
                        const newMsg = payload.new as Message;
                        setMessages(prev => {
                            if (prev.some(m => m.id === newMsg.id)) return prev;
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

    const fetchTaskDetails = async () => {
        try {
            const response = await fetch(`/api/tasks`);
            const data = await response.json();
            if (response.ok) {
                const found = Array.isArray(data) ? data.find((t: any) => t.id === id) : data;
                setTask(found);
            }
        } catch (error) {
            console.error('Error fetching task details:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await fetch(`/api/tasks/${id}/messages`);
            const data = await response.json();
            if (response.ok) {
                setMessages(data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
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

        const messageContent = textContent ? editorHtml : '';
        setIsSending(true);
        setNewMessage('');
        if (editorRef.current) editorRef.current.innerHTML = '';

        // Optimistic message
        const optimisticId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            id: optimisticId,
            task_id: id as string,
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

        setMessages(prev => [...prev, tempMessage]);

        try {
            const response = await fetch(`/api/tasks/${id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageContent,
                    sender_id: displayProfile.id,
                    attachments
                })
            });

            if (!response.ok) {
                setMessages(prev => prev.filter(m => m.id !== optimisticId));
                if (editorRef.current) editorRef.current.innerHTML = messageContent;
                setNewMessage(textContent);
            } else {
                const finalMsg = await response.json();
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
        formData.append('taskId', id as string);
        formData.append('senderId', displayProfile.id);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                handleSendMessage(undefined, [{
                    url: data.url,
                    name: data.name,
                    type: data.type
                }]);
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
        if (!task) return;

        const originalTask = { ...task };
        const newTask = { ...task, [field]: value };

        if (field === 'assigned_to') {
            const tm = teamMembers.find(t => t.profile_id === value);
            newTask.assignee = tm ? { id: tm.profile_id!, full_name: tm.name } : null;
        }

        setTask(newTask);

        try {
            const response = await fetch(`/api/tasks`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: task.id,
                    [field]: value
                })
            });

            if (!response.ok) {
                setTask(originalTask);
                alert(`Failed to update ${field}`);
            }
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            setTask(originalTask);
        }
    };

    const handleDeleteTask = async () => {
        if (!task) return;
        setIsDeleting(true);
        setDeleteError(null);

        try {
            const response = await fetch(`/api/tasks?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                router.push('/tasks');
            } else {
                const err = await response.json();
                setDeleteError(err.error || 'Failed to delete task');
            }
        } catch (error) {
            console.error('Delete task failed:', error);
            setDeleteError('An unexpected error occurred while deleting the task');
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading && !task) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#09090B]">
                <Loader2 size={32} className="animate-spin text-[#279da6]" />
            </div>
        );
    }

    if (!task) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#09090B] text-iron">
                <div className="text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 text-rose-500 opacity-50" />
                    <p className="font-bold">Task not found</p>
                    <button onClick={() => router.push('/tasks')} className="mt-4 text-[#279da6] hover:underline">Return to list</button>
                </div>
            </div>
        );
    }

    const isSuperAdmin = displayProfile?.role === 'super_admin';

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
                                    onClick={() => router.push('/tasks')}
                                    className="p-2 hover:bg-shark rounded-lg text-santas-gray hover:text-white transition-all"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-[#279da6] bg-shark/40 py-1 px-2.5 rounded-lg border border-[#279da6]/20 shadow-sm">
                                        TSK-{task.id.slice(0, 4).toUpperCase()}
                                    </span>
                                    <div className="flex flex-col justify-center">
                                        <h1 className="text-sm font-bold text-iron leading-tight">{task.title}</h1>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                            <span className="text-[8px] text-storm-gray font-black uppercase tracking-[0.2em] opacity-70">
                                                Active
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

                                {/* Task Body */}
                                <div className="p-8 max-w-4xl mx-auto w-full">
                                    <div className="mb-8">
                                        <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">{task.title}</h2>

                                        {/* Task Description Card */}
                                        <div className="flex items-start gap-4 mb-8">
                                            <div className="w-10 h-10 rounded-full bg-shark flex items-center justify-center text-[#279da6] shrink-0 border border-white/5 shadow-inner">
                                                <MessageSquare size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-shark/20 border border-shark/50 rounded-2xl p-6 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-[11px] font-black text-[#279da6] uppercase tracking-widest">Task Created</span>
                                                        <span className="text-[10px] text-storm-gray font-bold">
                                                            {new Date(task.created_at).toLocaleString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <p className="text-iron text-sm leading-relaxed whitespace-pre-wrap">
                                                        {task.description || 'No description provided.'}
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
                                                                {isHtmlContent(msg.message) ? (
                                                                    <div
                                                                        className="prose prose-sm prose-invert max-w-none [&_a]:text-[#279da6] [&_a]:underline [&_a]:font-bold"
                                                                        dangerouslySetInnerHTML={{ __html: msg.message }}
                                                                    />
                                                                ) : (
                                                                    msg.message.split('\n').map((line, i) => (
                                                                        <div key={i}>{line}</div>
                                                                    ))
                                                                )}
                                                                {msg.attachments && msg.attachments.length > 0 && (
                                                                    <div className="mt-3 space-y-2">
                                                                        {msg.attachments.map((at: any, idx: number) => (
                                                                            <div key={idx} onClick={() => window.open(at.url, '_blank')} className="block group/at cursor-pointer">
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
                                                                                            <p className="text-[10px] text-storm-gray font-bold uppercase tracking-widest">View File</p>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
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

                                {/* Message Composer */}
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
                                        <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">{task.title}</h4>
                                        <div className="text-[12px] text-storm-gray">
                                            <span className="font-bold">Created:</span> {new Date(task.created_at).toLocaleString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        {/* Creator */}
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-[12px] font-bold text-storm-gray">Created By:</span>
                                            <div className="flex items-center gap-2.5 bg-shark/20 py-1.5 px-3 rounded-xl border border-white/5">
                                                <div className="w-7 h-7 rounded-full bg-shark flex items-center justify-center text-[10px] text-[#279da6] font-black shrink-0 border border-white/5 shadow-inner">
                                                    {task.creator?.full_name?.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <p className="text-[11px] font-bold text-iron leading-tight truncate">{task.creator?.full_name || 'System'}</p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-bold text-storm-gray w-20">Status</span>
                                            <select
                                                value={task.status}
                                                onChange={(e) => handleUpdateField('status', e.target.value)}
                                                className="flex-1 bg-shark/30 text-iron border border-shark/60 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-shark/50 focus:outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="Todo">Todo</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Review">Review</option>
                                                <option value="Done">Done</option>
                                            </select>
                                        </div>

                                        {/* Priority */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-bold text-storm-gray w-20">Priority</span>
                                            <div className="flex-1 relative">
                                                <select
                                                    value={task.priority}
                                                    onChange={(e) => handleUpdateField('priority', e.target.value)}
                                                    className={`w-full bg-shark/20 border border-shark/40 pl-5 pr-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer hover:bg-shark/30 transition-all appearance-none ${task.priority === 'Critical' ? 'text-rose-500' :
                                                        task.priority === 'High' ? 'text-amber-500' :
                                                            task.priority === 'Medium' ? 'text-blue-400' :
                                                                'text-storm-gray'
                                                        }`}
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                    <option value="Critical">Critical</option>
                                                </select>
                                                <div className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full ${task.priority === 'Critical' ? 'bg-rose-500' :
                                                    task.priority === 'High' ? 'bg-amber-500' :
                                                        task.priority === 'Medium' ? 'bg-blue-400' :
                                                            'bg-storm-gray'
                                                    }`} />
                                            </div>
                                        </div>

                                        {/* Assigned To */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-bold text-storm-gray w-20">Assigned To</span>
                                            <div className="flex-1 flex items-center gap-2">
                                                <select
                                                    value={task.assigned_to || ''}
                                                    onChange={(e) => handleUpdateField('assigned_to', e.target.value)}
                                                    className="flex-1 bg-transparent text-[11px] font-bold text-iron focus:outline-none cursor-pointer hover:text-white transition-all appearance-none"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {teamMembers.filter((tm: any) => tm.profile_id).map((tm: any) => (
                                                        <option key={tm.id} value={tm.profile_id}>{tm.name}</option>
                                                    ))}
                                                </select>
                                                <div className="w-6 h-6 rounded-full bg-shark/40 border border-shark flex items-center justify-center text-storm-gray overflow-hidden">
                                                    {task.assignee ? (
                                                        <div className="w-full h-full bg-[#279da6] text-white flex items-center justify-center text-[10px] font-black">
                                                            {task.assignee.full_name?.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                    ) : (
                                                        <Plus size={14} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Due Date */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-bold text-storm-gray w-20">Due Date</span>
                                            <div className="flex-1 flex items-center justify-end gap-2 text-[11px] font-black text-iron">
                                                <input
                                                    ref={dateInputRef}
                                                    type="date"
                                                    value={task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => handleUpdateField('due_date', e.target.value)}
                                                    className="bg-transparent text-iron border-none focus:outline-none text-right cursor-pointer hover:text-white transition-all uppercase [color-scheme:dark]"
                                                />
                                                <Calendar
                                                    size={14}
                                                    className="text-storm-gray cursor-pointer hover:text-white transition-all"
                                                    onClick={() => dateInputRef.current?.showPicker()}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    {isSuperAdmin && (
                                        <div className="pt-6 border-t border-shark mt-auto">
                                            <button
                                                onClick={() => setIsDeleteModalOpen(true)}
                                                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 border border-rose-500/10 transition-all font-black text-[10px] uppercase tracking-widest group"
                                            >
                                                <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                                                Delete Task
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="bg-[#18181B] border border-rose-500/20 rounded-[32px] p-8 max-w-md w-full shadow-[0_0_50px_rgba(244,63,94,0.15)] animate-slide-up relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-[80px]" />

                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-6 mx-auto">
                                <Trash2 size={32} />
                            </div>

                            <h2 className="text-xl font-black text-white text-center uppercase tracking-tight mb-3">Delete Task?</h2>
                            <p className="text-storm-gray text-center text-sm leading-relaxed mb-8">
                                You are about to permanently delete <span className="text-white font-bold">"{task.title}"</span>. This action will remove all messages and attachments associated with this task. This cannot be undone.
                            </p>

                            {deleteError && (
                                <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs font-bold animate-shake">
                                    <AlertCircle size={16} />
                                    {deleteError}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setDeleteError(null);
                                    }}
                                    disabled={isDeleting}
                                    className="py-4 rounded-2xl bg-shark/40 border border-shark hover:bg-shark/60 text-iron font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteTask}
                                    disabled={isDeleting}
                                    className="py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Confirm Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
