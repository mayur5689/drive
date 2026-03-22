'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Lightbulb, TrendingUp } from 'lucide-react';

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
                body: JSON.stringify({ action: 'insights', payload: { fileStats } })
            });
            const data = await res.json();
            if (data.data?.insights) setInsights(data.data.insights);
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
    }, [fileStats.totalFiles]);

    if (fileStats.totalFiles === 0) return null;

    return (
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#6366f1]/10 text-[#818cf8]">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">AI Storage Insights</h3>
                        <p className="text-xs text-[#71717a]">{fileStats.totalFiles} files &middot; {formatBytes(fileStats.totalSize)}</p>
                    </div>
                </div>
                <button
                    onClick={fetchInsights}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#111] transition-all"
                >
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {isLoading ? (
                    Array(2).fill(0).map((_, i) => (
                        <div key={i} className="h-14 bg-[#111] rounded-xl shimmer" />
                    ))
                ) : insights.length > 0 ? (
                    insights.map((insight, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-[#111] border border-[#1e1e1e] hover:border-[#2a2a2a] transition-all">
                            <div className="shrink-0 w-8 h-8 rounded-lg bg-[#6366f1]/5 flex items-center justify-center text-[#818cf8]">
                                {i === 0 ? <Lightbulb size={16} /> : <TrendingUp size={16} />}
                            </div>
                            <p className="text-xs text-[#a1a1aa] leading-relaxed self-center">{insight}</p>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-3 text-xs text-[#71717a]">
                        Generating insights...
                    </div>
                )}
            </div>
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1073741824).toFixed(1)} GB`;
}
