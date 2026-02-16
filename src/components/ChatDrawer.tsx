'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Send,
    Paperclip,
    MoreHorizontal,
    Check,
    CheckCheck,
    Loader2,
    User,
    Shield
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
    sender?: {
        full_name: string;
        role: string;
    };
}

interface ChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    requestId: string;
    requestTitle: string;
}

export default function ChatDrawer({ isOpen, onClose, requestId, requestTitle }: ChatDrawerProps) {
    const { profile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && requestId) {
            fetchMessages();

            // Subscribe to real-time updates
            const channel = supabase
                .channel(`request-chat-${requestId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'request_messages',
                        filter: `request_id=eq.${requestId}`
                    },
                    async (payload) => {
                        // Fetch the full message with sender info
                        const { data, error } = await supabase
                            .from('request_messages')
                            .select('*, sender:sender_id(full_name, role)')
                            .eq('id', payload.new.id)
                            .single();

                        if (!error && data) {
                            setMessages(prev => [...prev, data as Message]);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [isOpen, requestId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/requests/${requestId}/messages`);
            const data = await response.json();
            if (response.ok) {
                setMessages(data);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !profile) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setIsSending(true);

        try {
            const response = await fetch(`/api/requests/${requestId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    sender_id: profile.id
                })
            });

            if (!response.ok) {
                const err = await response.json();
                console.error('Send failed:', err.error);
                // Optionally show error to user
            }
            // Real-time listener will add the message to the list
        } catch (error) {
            console.error('Send error:', error);
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex justify-end animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="relative w-full max-w-md h-full bg-[#121214] border-l border-shark shadow-2xl flex flex-col animate-slide-left">
                {/* Header */}
                <div className="h-20 px-6 border-b border-shark flex items-center justify-between bg-[#09090B]/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex flex-col">
                        <h2 className="text-sm font-black text-iron uppercase tracking-widest truncate max-w-[240px]">
                            {requestTitle}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#279da6] animate-pulse" />
                            <span className="text-[10px] font-bold text-storm-gray uppercase tracking-tighter">Live Connection</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-shark/40 rounded-xl text-storm-gray hover:text-white transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/images/dots.png')] bg-fixed opacity-95">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-storm-gray">
                            <Loader2 size={32} className="animate-spin text-[#279da6]" />
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Synchronizing messages</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                            <div className="w-16 h-16 rounded-full bg-shark/20 flex items-center justify-center mb-2">
                                <Send size={24} className="text-storm-gray -rotate-45" />
                            </div>
                            <p className="text-xs font-bold text-iron uppercase">No conversation yet</p>
                            <p className="text-[10px] font-medium text-storm-gray max-w-[200px]">Send the first message to start the discussion about this request.</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.sender_id === profile?.id;
                            const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;

                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isMe && showAvatar && (
                                        <div className="flex items-center gap-2 mb-2 ml-1">
                                            <div className="w-6 h-6 rounded-lg bg-[#279da6]/20 flex items-center justify-center text-[10px] font-black text-[#279da6]">
                                                {msg.sender?.full_name[0] || 'U'}
                                            </div>
                                            <span className="text-[10px] font-black text-storm-gray uppercase tracking-widest flex items-center gap-1">
                                                {msg.sender?.full_name}
                                                {msg.sender?.role === 'admin' && <Shield size={10} className="text-[#279da6]" />}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed group relative ${isMe
                                            ? 'bg-[#279da6] text-white rounded-tr-none shadow-lg shadow-[#279da6]/10'
                                            : 'bg-[#18181B] text-iron border border-shark rounded-tl-none'
                                        }`}>
                                        {msg.message}
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

                {/* Input Area */}
                <div className="p-4 bg-[#09090B]/50 backdrop-blur-md border-t border-shark sticky bottom-0">
                    <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
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
                                placeholder="Type a message..."
                                className="w-full bg-[#18181B] border border-shark/60 rounded-2xl py-3 pl-4 pr-12 text-sm text-iron focus:outline-none focus:border-[#279da6]/50 transition-all font-bold min-h-[52px] max-h-32 resize-none custom-scrollbar"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || isSending}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-[#279da6] text-white hover:bg-[#279da6]/90 transition-all disabled:opacity-30 disabled:hover:scale-100 hover:scale-105 active:scale-95 shadow-lg shadow-[#279da6]/20"
                            >
                                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                        <div className="flex items-center justify-between px-2">
                            <button type="button" className="flex items-center gap-2 text-storm-gray hover:text-white transition-colors">
                                <Paperclip size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Attach files</span>
                            </button>
                            <span className="text-[8px] font-bold text-storm-gray uppercase tracking-widest">Enter to send • Shift+Enter for new line</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
