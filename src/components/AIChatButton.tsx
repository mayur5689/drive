'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, Bot, Minimize2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AIChatButton() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fileMetadata, setFileMetadata] = useState<any>(null);
    const [allFiles, setAllFiles] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch storage data when user is available
    useEffect(() => {
        const fetchStorageData = async () => {
            if (!user?.id) return;

            try {
                const res = await fetch(`/api/storage/browse?userId=${user.id}`);
                const items = await res.json();
                setAllFiles(items || []);
            } catch (error) {
                console.error('Failed to fetch storage data:', error);
            }
        };

        fetchStorageData();
    }, [user?.id]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [chat]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const userMsg = message.trim();
        setMessage('');
        setChat(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            // Calculate file stats from allFiles
            const fileStats = {
                totalFiles: allFiles.filter((f: any) => f.type === 'file').length,
                totalFolders: allFiles.filter((f: any) => f.type === 'folder').length,
                totalSize: allFiles.filter((f: any) => f.type === 'file').reduce((sum: number, f: any) => sum + (f.size || 0), 0),
                filesByType: allFiles.filter((f: any) => f.type === 'file').reduce((acc: any, f: any) => {
                    const type = f.mime_type?.split('/')[0] || 'other';
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                }, {})
            };

            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'chat',
                    payload: {
                        message: userMsg,
                        history: chat,
                        fileMetadata: fileStats,
                        files: allFiles.filter((f: any) => f.type === 'file')
                    }
                })
            });
            const data = await res.json();
            setChat(prev => [...prev, { role: 'assistant', content: data.text || "Sorry, I couldn't process that." }]);
        } catch {
            setChat(prev => [...prev, { role: 'assistant', content: "Something went wrong. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const suggestions = [
        "How much storage am I using?",
        "Help me organize my files",
        "Find my recent documents",
    ];

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
            <div className={`fixed bottom-6 right-6 z-50 w-full max-w-[360px] h-[500px] bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95 pointer-events-none'}`}>
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
                                <span className="text-[10px] text-[#71717a]">Online</span>
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
                            <p className="text-xs text-[#71717a] mb-5">Ask me anything about your files</p>

                            <div className="w-full space-y-2">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setMessage(s); }}
                                        className="w-full text-left px-3 py-2 rounded-lg bg-[#111] border border-[#1e1e1e] text-xs text-[#a1a1aa] hover:text-white hover:border-[#2a2a2a] transition-all"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {chat.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-[#6366f1] text-white rounded-br-sm'
                                : 'bg-[#111] border border-[#1e1e1e] text-[#a1a1aa] rounded-bl-sm'
                                }`}>
                                {msg.content}
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
                            placeholder="Ask anything..."
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
