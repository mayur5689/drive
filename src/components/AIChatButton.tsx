'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Loader2, Bot, User, Minimize2 } from 'lucide-react';

export default function AIChatButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chat]);

    const handleSendMessage = async (e: React.FormEvent) => {
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
                    payload: { message: userMsg, history: chat }
                })
            });
            const data = await res.json();
            setChat(prev => [...prev, { role: 'assistant', content: data.text || "Sorry, I couldn't process that." }]);
        } catch (error) {
            console.error('Chat error:', error);
            setChat(prev => [...prev, { role: 'assistant', content: "Something went wrong. Please check your connection." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-8 right-8 z-50 p-4 rounded-full bg-[#279da6] text-white shadow-[0_0_30px_rgba(39,157,166,0.4)] hover:scale-110 hover:shadow-[#279da6]/60 transition-all duration-300 group ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            >
                <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
            </button>

            {/* Chat Drawer */}
            <div className={`fixed bottom-8 right-8 z-50 w-full max-w-[380px] h-[550px] bg-[#121214] border border-shark rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 flex flex-col ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'}`}>
                {/* Header */}
                <div className="p-5 flex items-center justify-between border-b border-shark bg-[#18181B]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#279da6]/10 text-[#279da6] flex items-center justify-center">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="text-[12px] font-black text-white uppercase tracking-tight">AI Cloud Assistant</h3>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-storm-gray uppercase tracking-widest">Optimizing Personal Drive</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 text-storm-gray hover:text-white transition-all">
                        <Minimize2 size={18} />
                    </button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-[#09090B]/30">
                    {chat.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-40 px-6">
                            <Bot size={40} className="mb-4 text-[#279da6]" />
                            <p className="text-[10px] font-black text-white uppercase mb-1 tracking-widest">HELLO!</p>
                            <p className="text-[9px] text-storm-gray uppercase tracking-widest leading-relaxed">
                                I'm your AI drive assistant. Ask me anything about your files or optimization!
                            </p>
                        </div>
                    )}
                    {chat.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                            <div className={`max-w-[85%] p-3.5 rounded-2xl text-[11px] font-bold leading-relaxed ${msg.role === 'user' ? 'bg-[#279da6] text-white rounded-tr-none' : 'bg-shark/40 border border-shark/50 text-iron rounded-tl-none'}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-shark/40 border border-shark/50 text-iron p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <Loader2 size={12} className="animate-spin text-[#279da6]" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-[#18181B] border-t border-shark">
                    <div className="relative">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask me anything..."
                            className="w-full bg-[#09090B] border border-shark rounded-xl py-3 pl-4 pr-12 text-[11px] font-bold text-iron focus:outline-none focus:border-[#279da6]/40 transition-all placeholder:text-storm-gray uppercase tracking-tight"
                        />
                        <button
                            type="submit"
                            disabled={!message.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#279da6] text-white rounded-lg hover:bg-[#279da6]/90 transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
