'use client';

import { useState, useEffect } from 'react';
import { X, Download, FileText, File as FileIcon, Image as ImageIcon, Film, Sparkles, Loader2, Check } from 'lucide-react';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        name: string;
        id?: string;
        url: string;
        type: string;
        description?: string;
    } | null;
}

export default function FilePreviewModal({ isOpen, onClose, file }: FilePreviewModalProps) {
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);

    useEffect(() => {
        setSummary(null);
    }, [file?.id, file?.name]);

    if (!isOpen || !file) return null;

    const isImage = file.type?.startsWith('image/');
    const isPdf = file.type?.includes('pdf');
    const isVideo = file.type?.startsWith('video/');

    const handleSummarize = async () => {
        setIsSummarizing(true);
        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'summarize',
                    payload: { fileName: file.name, mimeType: file.type, description: file.description }
                })
            });
            const data = await res.json();
            if (data.data?.summary) setSummary(data.data.summary);
        } catch (error) {
            console.error('Summarization error:', error);
        } finally {
            setIsSummarizing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-fade-in px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl shadow-2xl flex flex-col animate-zoom-in overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e] bg-[#0a0a0a]">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1] shrink-0">
                            {isImage ? <ImageIcon size={18} /> : isPdf ? <FileText size={18} /> : isVideo ? <Film size={18} /> : <FileIcon size={18} />}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate">{file.name}</h3>
                            <span className="text-xs text-[#71717a]">{file.type?.split('/').pop()?.toUpperCase() || 'FILE'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {!summary && (
                            <button
                                onClick={handleSummarize}
                                disabled={isSummarizing}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#6366f1]/10 hover:bg-[#6366f1]/20 text-[#818cf8] text-xs font-medium border border-[#6366f1]/20 transition-all disabled:opacity-50"
                            >
                                {isSummarizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                AI Summary
                            </button>
                        )}
                        {file.url && (
                            <a
                                href={file.url}
                                download={file.name}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#6366f1] hover:bg-[#818cf8] text-white text-xs font-medium transition-all"
                            >
                                <Download size={14} />
                                Download
                            </a>
                        )}
                        <button onClick={onClose} className="p-1.5 hover:bg-[#111] rounded-lg text-[#71717a] hover:text-white transition-all">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* AI Summary */}
                {summary && (
                    <div className="px-6 py-3 bg-[#6366f1]/5 border-b border-[#6366f1]/10 flex items-start gap-3 animate-slide-down">
                        <div className="mt-0.5 p-1 rounded-md bg-[#6366f1]/20 text-[#818cf8]">
                            <Sparkles size={12} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-medium text-[#818cf8] mb-0.5">AI Summary</p>
                            <p className="text-sm text-[#a1a1aa] leading-relaxed">{summary}</p>
                        </div>
                        <Check size={14} className="text-[#6366f1]/40 mt-1" />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-[#000]/30 min-h-[400px]">
                    {isImage ? (
                        <img
                            src={file.url}
                            alt={file.name}
                            className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl border border-[#1e1e1e]"
                        />
                    ) : isPdf ? (
                        <iframe
                            src={file.url}
                            className="w-full h-[65vh] rounded-xl border border-[#1e1e1e]"
                            title={file.name}
                        />
                    ) : isVideo ? (
                        <video
                            src={file.url}
                            controls
                            className="max-w-full max-h-[65vh] rounded-xl shadow-2xl border border-[#1e1e1e]"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-6 text-center py-16">
                            <div className="w-20 h-20 rounded-2xl bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-[#6366f1]">
                                <FileIcon size={40} />
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-white mb-1">{file.name}</h4>
                                <p className="text-sm text-[#71717a] mb-6">Preview not available for this file type</p>
                                {file.url && (
                                    <a
                                        href={file.url}
                                        download={file.name}
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6366f1] hover:bg-[#818cf8] text-white font-medium text-sm transition-all shadow-lg shadow-[#6366f1]/20"
                                    >
                                        <Download size={18} />
                                        Download File
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
