'use client';

import React, { useState, useEffect, useRef } from 'react';
import Linkify from 'linkify-react';
import {
    X, Send, User, Calendar, Flag, Loader2, Trash2,
    CheckCircle2, CircleDashed, RefreshCcw, AlertCircle,
    MessageSquare, Paperclip, CheckCheck, Check, Shield,
    FileText, File as FileIcon, Download, ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TaskItem } from '@/lib/data/tasks';
import { supabase } from '@/lib/supabase';

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: TaskItem | null;
    onUpdate: (updatedTask: TaskItem) => void;
    onDelete: (taskId: string) => void;
    profiles: any[];
    teamMembers: any[];
}

interface Attachment {
    name: string;
    url: string;
    type: string;
}

interface Message {
    id: string;
    task_id: string;
    sender_id: string;
    message: string;
    attachments: Attachment[];
    is_read: boolean;
    created_at: string;
    sender?: {
        full_name: string;
        role: string;
        avatar_url?: string;
    };
}

export default function TaskDetailModal({
    isOpen,
    onClose,
    task,
    onUpdate,
    onDelete,
    profiles,
    teamMembers
}: TaskDetailModalProps) {
    const { user, profile } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: '',
        status: '',
        assigned_to: '',
        due_date: ''
    });

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'Medium',
                status: task.status || 'Todo',
                assigned_to: task.assigned_to || '',
                due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
            });

            fetchMessages();

            const channel = supabase
                .channel(`task-chat-${task.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'task_messages',
                        filter: `task_id=eq.${task.id}`
                    },
                    async (payload: any) => {
                        const { data, error } = await supabase
                            .from('task_messages')
                            .select('*, sender:sender_id(full_name, role, avatar_url)')
                            .eq('id', payload.new.id)
                            .single();

                        if (!error && data) {
                            setMessages((prev) => {
                                if (prev.some(m => m.id === data.id)) return prev;
                                return [...prev, data as Message];
                            });
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [task]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        if (!task) return;
        setIsLoadingMessages(true);
        try {
            const response = await fetch(`/api/tasks/${task.id}/messages`);
            const data = await response.json();
            if (response.ok) {
                setMessages(data);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev: File[]) => prev.filter((_, i: number) => i !== index));
    };

    const uploadFiles = async (files: File[]): Promise<Attachment[]> => {
        const uploadedAttachments: Attachment[] = [];
        setIsUploading(true);

        for (const file of files) {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('taskId', task!.id);
            if (profile?.id) fd.append('senderId', profile.id);

            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: fd
                });

                if (response.ok) {
                    const data = await response.json();
                    uploadedAttachments.push({
                        name: data.name,
                        url: data.url,
                        type: data.type
                    });
                }
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }

        setIsUploading(false);
        return uploadedAttachments;
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!newMessage.trim() && selectedFiles.length === 0) || !profile || isSending || !task) return;

        setIsSending(true);
        const messageText = newMessage.trim();
        const filesToUpload = [...selectedFiles];
        setNewMessage('');
        setSelectedFiles([]);

        try {
            let attachments: Attachment[] = [];
            if (filesToUpload.length > 0) {
                attachments = await uploadFiles(filesToUpload);
                if (attachments.length === 0 && messageText === '') {
                    setIsSending(false);
                    alert("Failed to upload attachments. Please try again.");
                    return;
                }
            }

            const response = await fetch(`/api/tasks/${task.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText || (attachments.length > 0 ? `Shared ${attachments.length} attachment(s)` : ''),
                    sender_id: profile.id,
                    attachments
                })
            });

            if (!response.ok) {
                const err = await response.json();
                console.error('Send failed:', err.error);
            }
        } catch (error) {
            console.error('Send error:', error);
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen || !task) return null;

    const handleUpdate = async (field: string, value: any) => {
        const updatedData = { ...formData, [field]: value };
        setFormData(updatedData);

        try {
            const response = await fetch(`/api/tasks`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: task.id,
                    [field]: value
                })
            });

            if (!response.ok) throw new Error('Failed to update task');
            const updatedTask = await response.json();

            const tm = teamMembers.find((t: any) => t.profile_id === (field === 'assigned_to' ? value : formData.assigned_to));
            const p = profiles.find((pr: any) => pr.id === (field === 'assigned_to' ? value : formData.assigned_to));
            const assignee = tm ? { id: tm.profile_id, full_name: tm.name, team_members: [{ name: tm.name }] } : (p ? { id: p.id, full_name: p.full_name || p.email } : null);

            onUpdate({ ...updatedTask, assignee });
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/tasks?id=${task.id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete task');
            onDelete(task.id);
            onClose();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task');
        } finally {
            setIsDeleting(false);
        }
    };

    const assignees = teamMembers.map((tm: any) => ({
        id: tm.profile_id,
        name: tm.name || tm.full_name || 'Team Member'
    }));

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Todo': return <CircleDashed size={16} className="text-storm-gray" />;
            case 'In Progress': return <RefreshCcw size={16} className="text-malibu animate-spin-slow" />;
            case 'Review': return <AlertCircle size={16} className="text-amber-400" />;
            case 'Done': return <CheckCircle2 size={16} className="text-emerald-400" />;
            default: return <CircleDashed size={16} />;
        }
    };

    const renderAttachment = (att: Attachment) => {
        const isImage = att.type?.startsWith('image/');

        if (isImage) {
            return (
                <div key={att.url} className="mt-2 rounded-lg overflow-hidden border border-white/10 group/img relative cursor-pointer" onClick={() => window.open(att.url, '_blank')}>
                    <img src={att.url} alt={att.name} className="max-w-full h-auto max-h-60 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Download size={20} className="text-white" />
                    </div>
                </div>
            );
        }

        return (
            <div key={att.url} className="mt-2 flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5 hover:border-[#279da6]/30 transition-all cursor-pointer group/file" onClick={() => window.open(att.url, '_blank')}>
                <div className="w-10 h-10 rounded-lg bg-[#279da6]/10 flex items-center justify-center text-[#279da6]">
                    {att.type?.includes('pdf') ? <FileText size={20} /> : <FileIcon size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-iron truncate">{att.name}</p>
                    <p className="text-[9px] font-medium text-storm-gray uppercase tracking-widest">Click to download</p>
                </div>
                <Download size={14} className="text-storm-gray group-hover/file:text-[#279da6]" />
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] flex justify-end animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer - wider to accommodate detail + chat */}
            <div className="relative w-full max-w-4xl h-full bg-[#121214] border-l border-shark shadow-2xl flex animate-slide-left">
                {/* Left Panel: Task Details */}
                <div className="flex-1 flex flex-col border-r border-shark/30 min-w-0">
                    {/* Header */}
                    <div className="h-16 px-6 border-b border-shark flex items-center justify-between bg-[#09090B]/50 backdrop-blur-md shrink-0">
                        <div className="flex items-center gap-3">
                            <button onClick={onClose} className="p-2 hover:bg-shark/40 rounded-xl text-storm-gray hover:text-white transition-all">
                                <ChevronLeft size={20} />
                            </button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-[#279da6] bg-shark/40 py-0.5 px-2 rounded-lg border border-[#279da6]/20">
                                        TSK-{task.id.slice(0, 4).toUpperCase()}
                                    </span>
                                    <h2 className="text-sm font-black text-iron uppercase tracking-widest truncate max-w-[300px]">
                                        Task Details
                                    </h2>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase text-storm-gray hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
                        >
                            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            <span>Delete</span>
                        </button>
                    </div>

                    {/* Task Detail Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {/* Title */}
                        <div>
                            <input
                                className="bg-transparent text-xl font-black text-white uppercase tracking-tighter focus:outline-none w-full border-b border-transparent focus:border-[#279da6]/30 pb-1"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                onBlur={() => handleUpdate('title', formData.title)}
                            />
                        </div>

                        {/* Status & Priority Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-storm-gray uppercase tracking-widest ml-1">Status</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                                        {getStatusIcon(formData.status)}
                                    </div>
                                    <select
                                        value={formData.status}
                                        onChange={e => handleUpdate('status', e.target.value)}
                                        className="w-full bg-black/40 border border-shark rounded-xl p-3 pl-10 pr-10 !text-white appearance-none focus:border-[#279da6]/50 focus:outline-none transition-all cursor-pointer font-bold text-xs [color-scheme:dark]"
                                    >
                                        {['Todo', 'In Progress', 'Review', 'Done'].map(s => (
                                            <option key={s} value={s} className="bg-[#18181B] !text-white">{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-storm-gray uppercase tracking-widest ml-1">Priority</label>
                                <div className="relative">
                                    <Flag className="absolute left-3 top-1/2 -translate-y-1/2 text-storm-gray z-10" size={14} />
                                    <select
                                        value={formData.priority}
                                        onChange={e => handleUpdate('priority', e.target.value)}
                                        className={`w-full bg-black/40 border border-shark rounded-xl p-3 pl-10 pr-10 appearance-none focus:border-[#279da6]/50 focus:outline-none transition-all cursor-pointer font-bold text-xs [color-scheme:dark] ${formData.priority === 'Critical' ? '!text-rose-500' :
                                            formData.priority === 'High' ? '!text-amber-500' :
                                                formData.priority === 'Medium' ? '!text-malibu' : '!text-storm-gray'
                                            }`}
                                    >
                                        {['Low', 'Medium', 'High', 'Critical'].map(p => (
                                            <option key={p} value={p} className="bg-[#18181B] !text-white">{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Assignee & Due Date Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-storm-gray uppercase tracking-widest ml-1">Assigned To</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-storm-gray z-10" size={14} />
                                    <select
                                        value={formData.assigned_to}
                                        onChange={e => handleUpdate('assigned_to', e.target.value)}
                                        className="w-full bg-black/40 border border-shark rounded-xl p-3 pl-10 pr-10 !text-white appearance-none focus:border-[#279da6]/50 focus:outline-none transition-all cursor-pointer font-bold text-xs [color-scheme:dark]"
                                    >
                                        <option value="" className="bg-[#18181B] !text-white">Unassigned</option>
                                        {assignees.map((a: any) => (
                                            <option key={a.id} value={a.id} className="bg-[#18181B] !text-white">{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-storm-gray uppercase tracking-widest ml-1">Due Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-storm-gray z-10" size={14} />
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                        onBlur={() => handleUpdate('due_date', formData.due_date)}
                                        className="w-full bg-black/40 border border-shark rounded-xl p-3 pl-10 text-iron focus:border-[#279da6]/50 focus:outline-none transition-all font-bold text-xs [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-storm-gray uppercase tracking-widest ml-1">Description</label>
                            <textarea
                                rows={5}
                                placeholder="Describe the task in detail..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                onBlur={() => handleUpdate('description', formData.description)}
                                className="w-full bg-black/40 border border-shark rounded-xl p-4 text-iron placeholder:text-storm-gray focus:border-[#279da6]/50 focus:outline-none transition-all resize-none text-sm leading-relaxed"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="h-10 px-6 bg-shark/10 border-t border-shark/30 flex items-center justify-between text-[8px] text-storm-gray font-black uppercase tracking-[0.2em] opacity-60 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <User size={9} />
                                <span>Created by {task.creator?.full_name || 'System'}</span>
                            </div>
                            <div className="w-[1px] h-3 bg-shark/60" />
                            <div className="flex items-center gap-1">
                                <Calendar size={9} />
                                <span>{new Date(task.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Discussions (identical to ChatDrawer) */}
                <div className="w-[380px] flex flex-col bg-[#09090B]/40 shrink-0">
                    {/* Chat Header */}
                    <div className="h-16 px-6 border-b border-shark/30 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <MessageSquare size={16} className="text-[#279da6]" />
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-iron">Discussion</h3>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#279da6] animate-pulse" />
                            <span className="text-[9px] font-bold text-storm-gray uppercase tracking-tighter">Live</span>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {isLoadingMessages ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-storm-gray">
                                <Loader2 size={32} className="animate-spin text-[#279da6]" />
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Synchronizing messages</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                                <div className="w-16 h-16 rounded-full bg-shark/20 flex items-center justify-center mb-2">
                                    <Send size={24} className="text-storm-gray -rotate-45" />
                                </div>
                                <p className="text-xs font-bold text-iron uppercase">No discussion yet</p>
                                <p className="text-[10px] font-medium text-storm-gray max-w-[200px]">Start the conversation about this task.</p>
                            </div>
                        ) : (
                            messages.map((msg: Message, index: number) => {
                                const isMe = msg.sender_id === profile?.id;
                                const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;

                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        {!isMe && showAvatar && (
                                            <div className="flex items-center gap-2 mb-2 ml-1">
                                                <div className="w-6 h-6 rounded-lg bg-[#279da6]/20 flex items-center justify-center text-[10px] font-black text-[#279da6]">
                                                    {msg.sender?.full_name?.[0] || 'U'}
                                                </div>
                                                <span className="text-[10px] font-black text-storm-gray uppercase tracking-widest flex items-center gap-1">
                                                    {msg.sender?.full_name}
                                                    {msg.sender?.role !== 'client' && <Shield size={10} className="text-[#279da6]" />}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed group relative ${isMe
                                            ? 'bg-[#279da6] text-white rounded-tr-none shadow-lg shadow-[#279da6]/10'
                                            : 'bg-[#18181B] text-iron border border-shark rounded-tl-none'
                                            }`}>
                                            <Linkify
                                                options={{
                                                    target: '_blank',
                                                    className: isMe ? 'text-white underline font-bold' : 'text-[#279da6] underline font-bold'
                                                }}
                                            >
                                                {msg.message}
                                            </Linkify>

                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-2 space-y-2">
                                                    {msg.attachments.map(renderAttachment)}
                                                </div>
                                            )}

                                            <div className={`absolute bottom-[-18px] ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                <span className="text-[8px] font-bold text-storm-gray uppercase">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isMe && (
                                                    msg.is_read ? <CheckCheck size={10} className="text-[#279da6]" /> : <Check size={10} className="text-storm-gray" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area - identical to ChatDrawer */}
                    <div className="p-4 bg-[#09090B]/50 backdrop-blur-md border-t border-shark sticky bottom-0 shrink-0">
                        <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
                            {/* Selected Files Preview */}
                            {selectedFiles.length > 0 && (
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                                    {selectedFiles.map((file: File, idx: number) => (
                                        <div key={idx} className="relative group/file-preview shrink-0">
                                            <div className="w-12 h-12 rounded-xl bg-shark/40 border border-shark flex items-center justify-center overflow-hidden">
                                                {file.type.startsWith('image/') ? (
                                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                                ) : (
                                                    <FileIcon size={20} className="text-storm-gray" />
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(idx)}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/file-preview:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-12 h-12 rounded-xl border border-dashed border-shark flex items-center justify-center text-storm-gray hover:text-[#279da6] hover:border-[#279da6]/50 transition-all shrink-0"
                                    >
                                        <Paperclip size={18} />
                                    </button>
                                </div>
                            )}

                            <div className="relative group">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                    placeholder={isUploading ? "Uploading files..." : "Type a message..."}
                                    disabled={isUploading}
                                    className="w-full bg-[#18181B] border border-shark/60 rounded-2xl py-3 pl-4 pr-12 text-sm text-iron focus:outline-none focus:border-[#279da6]/50 transition-all font-bold min-h-[52px] max-h-32 resize-none custom-scrollbar"
                                />
                                <button
                                    type="submit"
                                    disabled={(!newMessage.trim() && selectedFiles.length === 0) || isSending || isUploading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-[#279da6] text-white hover:bg-[#279da6]/90 transition-all disabled:opacity-30 disabled:hover:scale-100 hover:scale-105 active:scale-95 shadow-lg shadow-[#279da6]/20"
                                >
                                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                            </div>
                            <input
                                type="file"
                                multiple
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div className="flex items-center justify-between px-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 text-storm-gray hover:text-white transition-colors"
                                >
                                    <Paperclip size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Attach files</span>
                                </button>
                                <span className="text-[8px] font-bold text-storm-gray uppercase tracking-widest">Enter to send</span>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
