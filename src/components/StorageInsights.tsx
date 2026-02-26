'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Lightbulb, Zap, TrendingUp } from 'lucide-react';

interface StorageInsightsProps {
    fileStats: {
        totalFiles: number;
        totalSize: number;
        typeCounts: Record<string, number>;
    };
}

export default function StorageInsights({ fileStats }: StorageInsightsProps) {
    const [insights, setInsights] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchInsights = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'insights',
                    payload: { fileStats }
                })
            });
            const data = await res.json();
            if (data.data?.insights) {
                setInsights(data.data.insights);
            }
        } catch (error) {
            console.error('Failed to fetch insights:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (fileStats.totalFiles > 0 && insights.length === 0) {
            fetchInsights();
        }
    }, [fileStats]);

    if (fileStats.totalFiles === 0) return null;

    return (
        <div className="bg-[#121214] border border-shark/50 rounded-3xl p-6 mb-8 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#279da6]/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[#279da6]/10 transition-all duration-700" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#279da6]/10 text-[#279da6] border border-[#279da6]/20 shadow-[0_0_15px_rgba(39,157,166,0.1)]">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">AI Storage Insights</h3>
                        <p className="text-[10px] font-bold text-storm-gray uppercase tracking-widest">Powered by Gemini Optimization</p>
                    </div>
                </div>
                <button
                    onClick={fetchInsights}
                    disabled={isLoading}
                    className="p-2 rounded-lg bg-shark/40 text-storm-gray hover:text-white transition-all hover:bg-shark"
                >
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {isLoading ? (
                    Array(2).fill(0).map((_, i) => (
                        <div key={i} className="h-16 bg-shark/20 animate-pulse rounded-2xl border border-shark/30" />
                    ))
                ) : insights.length > 0 ? (
                    insights.map((insight, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-shark/20 border border-shark/30 hover:border-[#279da6]/20 transition-all group/item">
                            <div className="shrink-0 w-10 h-10 rounded-xl bg-[#279da6]/5 flex items-center justify-center text-[#279da6] group-hover/item:scale-110 transition-transform">
                                {i === 0 ? <Lightbulb size={18} /> : <TrendingUp size={18} />}
                            </div>
                            <p className="text-[11px] font-bold text-iron leading-relaxed uppercase tracking-tight">
                                {insight}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-4 bg-shark/10 rounded-2xl border border-dashed border-shark text-[10px] font-black text-storm-gray uppercase tracking-widest">
                        Generating smart suggestions for your drive...
                    </div>
                )}
            </div>
        </div>
    );
}
