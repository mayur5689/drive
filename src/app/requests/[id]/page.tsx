'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
    Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

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
        full_name: string;
        email: string;
    } | null;
    assignee: {
        full_name: string;
    } | null;
}

export default function RequestDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { profile } = useAuth();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [request, setRequest] = useState<RequestDetails | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isOnline, setIsOnline] = useState(true); // Mock status
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (id) {
            fetchRequestDetails();
            fetchMessages();

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
            // Note: The logic for fetching a single request might need an API update
            // For now, we'll use the list API and filter if needed, or assume the API handles it
            const data = await response.json();
            if (response.ok) {
                // Find the specific request if the API returns a list
                const found = Array.isArray(data) ? data.find((r: any) => r.id === id) : data;
                setRequest(found);
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
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent, attachments: any[] = []) => {
        if (e) e.preventDefault();
        if ((!newMessage.trim() && attachments.length === 0) || !profile || isSending) return;

        const messageText = newMessage.trim();
        setIsSending(true);
        setNewMessage('');

        // Optimistic message
        const optimisticId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            id: optimisticId,
            request_id: id as string,
            sender_id: profile.id,
            message: messageText,
            attachments: attachments,
            is_read: false,
            created_at: new Date().toISOString(),
            sender: {
                full_name: profile.full_name || 'You',
                role: profile.role || 'user'
            }
        };

        // Add to local state immediately
        setMessages(prev => [...prev, tempMessage]);

        try {
            const response = await fetch(`/api/requests/${id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    sender_id: profile.id,
                    attachments
                })
            });

            if (!response.ok) {
                // Remove optimistic message on error
                setMessages(prev => prev.filter(m => m.id !== optimisticId));
                setNewMessage(messageText); // Restore input
            } else {
                const finalMsg = await response.json();
                // Replace temp message with server message
                setMessages(prev => prev.map(m => m.id === optimisticId ? finalMsg : m));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
            setNewMessage(messageText);
        } finally {
            setIsSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

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

    const handleUpdateField = async (field: string, value: string) => {
        if (!request) return;

        // Optimistic update
        const originalRequest = { ...request };
        setRequest({ ...request, [field]: value });

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
        <div className="flex h-screen bg-[#09090B] text-iron font-sans overflow-hidden">
            <Sidebar isCollapsed={isSidebarCollapsed} />

            <div className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative">
                <div className="flex-1 flex flex-col min-w-0 bg-[#121214] rounded-t-2xl overflow-hidden border-t border-l border-r border-shark mt-6 mr-6">

                    {/* Header */}
                    <div className="h-16 border-b border-shark flex items-center justify-between px-6 bg-shark/5">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/requests')}
                                className="p-2 hover:bg-shark rounded-lg text-santas-gray hover:text-white transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-sm font-bold text-iron">Request Details</h1>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-rose-500'}`} />
                                    <span className="text-[10px] text-storm-gray font-bold uppercase tracking-widest">
                                        {isOnline ? 'Live Connection' : 'Offline'}
                                    </span>
                                </div>
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
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/5 shadow-lg relative ${isMe ? 'bg-[#279da6] text-white overflow-hidden' : 'bg-shark text-[#279da6]'
                                                        }`}>
                                                        {isMe ? (
                                                            <span className="font-black text-xs">{profile?.full_name?.split(' ').map(n => n[0]).join('')}</span>
                                                        ) : (
                                                            <span className="font-black text-xs">{msg.sender?.full_name?.split(' ').map(n => n[0]).join('')}</span>
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
                                                            {/* Simple Markdown-lite formatter */}
                                                            {msg.message.split('\n').map((line, i) => (
                                                                <div key={i}>
                                                                    {line.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__|_.*?_)/).map((part, j) => {
                                                                        if (part.startsWith('**') && part.endsWith('**')) {
                                                                            return <strong key={j}>{part.slice(2, -2)}</strong>;
                                                                        }
                                                                        if (part.startsWith('*') && part.endsWith('*')) {
                                                                            return <em key={j}>{part.slice(1, -1)}</em>;
                                                                        }
                                                                        if (part.startsWith('__') && part.endsWith('__')) {
                                                                            return <u key={j}>{part.slice(2, -2)}</u>;
                                                                        }
                                                                        if (part.startsWith('_') && part.endsWith('_')) {
                                                                            return <em key={j}>{part.slice(1, -1)}</em>;
                                                                        }
                                                                        return part;
                                                                    })}
                                                                </div>
                                                            ))}
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
                                            <button className="p-1.5 hover:bg-shark rounded text-storm-gray hover:text-white transition-all"><Bold size={14} /></button>
                                            <button className="p-1.5 hover:bg-shark rounded text-storm-gray hover:text-white transition-all"><Italic size={14} /></button>
                                            <button className="p-1.5 hover:bg-shark rounded text-storm-gray hover:text-white transition-all"><Underline size={14} /></button>
                                            <div className="w-px h-4 bg-shark mx-1"></div>
                                            <button className="p-1.5 hover:bg-shark rounded text-storm-gray hover:text-white transition-all"><List size={14} /></button>
                                            <button className="p-1.5 hover:bg-shark rounded text-storm-gray hover:text-white transition-all"><LinkIcon size={14} /></button>
                                            <div className="flex-1"></div>
                                            <button className="p-1.5 hover:bg-shark rounded text-storm-gray hover:text-white transition-all"><Smile size={14} /></button>
                                        </div>
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            placeholder="Write your message here..."
                                            className="w-full bg-transparent border-none text-iron placeholder:text-storm-gray p-4 text-sm focus:outline-none min-h-[120px] resize-none"
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
                        <div className="w-[340px] border-l border-shark bg-shark/10 flex flex-col p-8 overflow-y-auto custom-scrollbar">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                                <AlertCircle size={16} className="text-[#279da6]" />
                                Summary
                            </h3>

                            <div className="space-y-8">
                                {/* Base Info */}
                                <div className="space-y-6">
                                    <div>
                                        <span className="block text-[10px] font-black text-storm-gray uppercase tracking-widest mb-2">Request Title</span>
                                        <p className="text-sm font-bold text-white leading-tight">{request.title}</p>
                                        <span className="block text-[10px] text-storm-gray mt-1">Created: {new Date(request.created_at).toLocaleDateString()}</span>
                                    </div>

                                    <div>
                                        <span className="block text-[10px] font-black text-storm-gray uppercase tracking-widest mb-3">Initiated By</span>
                                        <div className="flex items-center gap-3 bg-shark/20 border border-shark/50 p-4 rounded-2xl shadow-sm">
                                            <div className="w-10 h-10 rounded-lg bg-[#279da6]/20 flex items-center justify-center text-[#279da6] shrink-0 border border-[#279da6]/20">
                                                <User size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-iron truncate">{request.client?.full_name}</p>
                                                <p className="text-[10px] text-storm-gray font-bold truncate">Client</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-shark/60"></div>

                                {/* Controls */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between group cursor-pointer relative">
                                        <div className="flex items-center gap-3 text-santas-gray group-hover:text-iron transition-all">
                                            <CheckCircle2 size={16} />
                                            <span className="text-[11px] font-black uppercase tracking-widest">Status</span>
                                        </div>
                                        <select
                                            value={request.status}
                                            onChange={(e) => handleUpdateField('status', e.target.value)}
                                            className="appearance-none bg-[#279da6]/10 text-[#279da6] border border-[#279da6]/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer hover:bg-[#279da6]/20 transition-all"
                                        >
                                            <option value="Todo">Todo</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Review">Review</option>
                                            <option value="Done">Done</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between group cursor-pointer relative">
                                        <div className="flex items-center gap-3 text-santas-gray group-hover:text-iron transition-all">
                                            <Clock size={16} />
                                            <span className="text-[11px] font-black uppercase tracking-widest">Priority</span>
                                        </div>
                                        <select
                                            value={request.priority}
                                            onChange={(e) => handleUpdateField('priority', e.target.value)}
                                            className={`appearance-none bg-transparent border-none text-[11px] font-black uppercase tracking-widest focus:outline-none cursor-pointer text-right transition-all ${request.priority === 'Critical' ? 'text-rose-500' :
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
                                    </div>

                                    <div className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-3 text-santas-gray group-hover:text-iron transition-all">
                                            <User size={16} />
                                            <span className="text-[11px] font-black uppercase tracking-widest">Assigned To</span>
                                        </div>
                                        <div className="text-[11px] font-black text-iron/60 text-right uppercase tracking-widest">
                                            {request.assignee?.full_name || 'None'}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-3 text-santas-gray group-hover:text-iron transition-all">
                                            <Calendar size={16} />
                                            <span className="text-[11px] font-black uppercase tracking-widest">Due Date</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="dd-mm-yyyy"
                                            className="bg-transparent border-none text-right text-[11px] font-black text-iron/60 placeholder:text-shark focus:outline-none uppercase"
                                            value={request.due_date ? new Date(request.due_date).toLocaleDateString() : ''}
                                            readOnly
                                        />
                                    </div>

                                    <div className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-3 text-santas-gray group-hover:text-iron transition-all">
                                            <Tag size={16} />
                                            <span className="text-[11px] font-black uppercase tracking-widest">Tags</span>
                                        </div>
                                        <button className="w-6 h-6 flex items-center justify-center rounded-md border border-shark bg-shark/20 text-storm-gray hover:text-white hover:bg-[#279da6]/20 transition-all">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-8 mt-auto">
                                    <button className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 border border-rose-500/10 transition-all font-black text-[11px] uppercase tracking-widest group shadow-2xl">
                                        <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                                        Delete Request
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
