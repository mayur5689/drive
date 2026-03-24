'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Send, Loader2, Bot, Minimize2, CheckCircle2, FolderPlus, Star, Trash2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    actions?: AIAction[];
    actionResults?: string[];
}

interface AIAction {
    type: string;
    name?: string;
    id?: string;
    newName?: string;
    itemType?: string;
    parentId?: string | null;
    starred?: boolean;
    targetFolderId?: string | null;
}

interface StorageContext {
    files: any[];
    folders: any[];
    stats: { totalFiles: number; totalSize: number; typeCounts: Record<string, number> };
}

export default function AIChatButton() {
    const { user, profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [storageContext, setStorageContext] = useState<StorageContext | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchStorageContext = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`/api/storage/all?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setStorageContext(data);
            }
        } catch (error) {
            console.error('Failed to fetch storage context:', error);
        }
    }, [user?.id]);

    // Fetch full storage context when opened or user changes
    useEffect(() => {
        if (isOpen) fetchStorageContext();
    }, [isOpen, fetchStorageContext]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [chat, isLoading]);


    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const userMsg = message.trim();
        setMessage('');
        setChat(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'chat',
                    payload: {
                        message: userMsg,
                        history: chat.map(m => ({ role: m.role, content: m.content })),
                        storageContext: storageContext || { files: [], folders: [], stats: { totalFiles: 0, totalSize: 0, typeCounts: {} } },
                        userProfile: { email: profile?.email, name: profile?.full_name },
                        userId: user?.id,
                    },
                }),
            });
            const data = await res.json();
            const aiText = data.text || "Sorry, I couldn't process that.";
            const serverActions = data.actions || [];

            // Actions are now executed server-side — just show results and refresh
            const actionResults = serverActions.map((a: any) => a.result || a.message || '');

            if (serverActions.length > 0) {
                // Refresh storage context and file list
                await fetchStorageContext();
                window.dispatchEvent(new CustomEvent('storage-changed'));
            }

            setChat(prev => [...prev, {
                role: 'assistant',
                content: aiText,
                actions: serverActions.length > 0 ? serverActions : undefined,
                actionResults: actionResults.length > 0 ? actionResults.filter(Boolean) : undefined,
            }]);
        } catch {
            setChat(prev => [...prev, { role: 'assistant', content: "Something went wrong. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'create_folder': return <FolderPlus size={12} />;
            case 'star':
            case 'unstar': return <Star size={12} />;
            case 'delete': return <Trash2 size={12} />;
            case 'move': return <ArrowRight size={12} />;
            default: return <CheckCircle2 size={12} />;
        }
    };

    const suggestions = [
        "What files do I have?",
        "Create a folder called Documents",
        "How much storage am I using?",
        "Organize my files",
    ];

    const formatStorageInfo = () => {
        if (!storageContext) return '';
        const mb = ((storageContext.stats.totalSize || 0) / 1048576).toFixed(1);
        return `${storageContext.stats.totalFiles} files · ${mb} MB`;
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-br from-[#6366f1] to-[#06b6d4] text-white shadow-lg shadow-[#6366f1]/30 hover:scale-110 transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            >
                <Sparkles size={22} />
            </button>

            {/* Chat Panel */}
            <div className={`fixed bottom-6 right-6 z-50 w-full max-w-[400px] h-[550px] bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95 pointer-events-none'}`}>
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-[#1e1e1e] bg-[#0a0a0a]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center">
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                                <span className="text-[10px] text-[#71717a]">
                                    {storageContext ? formatStorageInfo() : 'Connecting...'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-1.5 text-[#71717a] hover:text-white transition-colors rounded-lg hover:bg-[#111]">
                        <Minimize2 size={16} />
                    </button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {chat.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <Bot size={36} className="mb-3 text-[#6366f1]" />
                            <p className="text-sm font-medium text-white mb-1">Hi! I&apos;m your AI assistant</p>
                            <p className="text-xs text-[#71717a] mb-5">I can manage your files, create folders, and answer questions about your storage.</p>

                            <div className="w-full space-y-2">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setMessage(s); }}
                                        className="w-full text-left px-3 py-2 rounded-lg bg-[#111] border border-[#1e1e1e] text-xs text-[#a1a1aa] hover:text-white hover:border-[#6366f1]/30 transition-all"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {chat.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                            <div className={`max-w-[85%] ${msg.role === 'user' ? '' : ''}`}>
                                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-[#6366f1] text-white rounded-br-sm'
                                    : 'bg-[#111] border border-[#1e1e1e] text-[#d4d4d8] rounded-bl-sm'
                                    }`}>
                                    {msg.content}
                                </div>

                                {/* Action results */}
                                {msg.actionResults && msg.actionResults.length > 0 && (
                                    <div className="mt-1.5 space-y-1">
                                        {msg.actionResults.map((result, j) => (
                                            <div key={j} className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e]">
                                                {msg.actions?.[j] ? getActionIcon(msg.actions[j].type) : <CheckCircle2 size={12} />}
                                                {result}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-[#111] border border-[#1e1e1e] px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2">
                                <Loader2 size={12} className="animate-spin text-[#6366f1]" />
                                <span className="text-xs text-[#71717a]">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-3 bg-[#0a0a0a] border-t border-[#1e1e1e]">
                    <div className="relative">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask anything or give commands..."
                            className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl py-2.5 pl-4 pr-11 text-sm text-white focus:outline-none focus:border-[#6366f1]/40 transition-all placeholder:text-[#3f3f46]"
                        />
                        <button
                            type="submit"
                            disabled={!message.trim() || isLoading}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-[#6366f1] text-white rounded-lg hover:bg-[#818cf8] transition-all disabled:opacity-30"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
