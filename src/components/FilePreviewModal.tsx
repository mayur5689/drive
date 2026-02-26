'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, FileText, File as FileIcon, Image as ImageIcon, ExternalLink, Sparkles, Loader2, Check } from 'lucide-react';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        name: string;
        id?: string;
        url: string;
        previewUrl?: string;
        type: string;
        uploaded_by?: string;
        uploaded_at?: string;
        description?: string;
    } | null;
}

export default function FilePreviewModal({ isOpen, onClose, file }: FilePreviewModalProps) {
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);

    // Reset summary when file changes
    useEffect(() => {
        setSummary(null);
    }, [file?.id, file?.name]);

    if (!isOpen || !file) return null;

    const isImage = file.type?.startsWith('image/');
    const isPdf = file.type?.includes('pdf');
    const isVideo = file.type?.startsWith('video/');

    const displayUrl = file.previewUrl || file.url;

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
            if (data.data?.summary) {
                setSummary(data.data.summary);
            }
        } catch (error) {
            console.error('Summarization error:', error);
        } finally {
            setIsSummarizing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-fade-in px-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#121214] border border-shark rounded-3xl shadow-2xl flex flex-col animate-zoom-in overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-shark bg-[#09090B]/60 relative z-20">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#279da6]/10 flex items-center justify-center text-[#279da6] shrink-0">
                            {isImage ? <ImageIcon size={20} /> :
                                isPdf ? <FileText size={20} /> :
                                    <FileIcon size={20} />}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-black text-iron truncate uppercase tracking-tight">{file.name}</h3>
                            <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[9px] font-black text-[#279da6] uppercase tracking-[0.2em]">{file.type?.split('/').pop() || 'FILE'}</span>
                                {file.uploaded_at && (
                                    <span className="text-[9px] font-bold text-storm-gray uppercase tracking-widest">
                                        {new Date(file.uploaded_at).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {!summary && (
                            <button
                                onClick={handleSummarize}
                                disabled={isSummarizing}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#279da6]/10 hover:bg-[#279da6]/20 text-[#279da6] text-[10px] font-black uppercase tracking-widest border border-[#279da6]/20 transition-all disabled:opacity-50"
                            >
                                {isSummarizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                <span>AI Summary</span>
                            </button>
                        )}
                        <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-shark/40 hover:bg-shark text-iron transition-all"
                            title="Open Original"
                        >
                            <ExternalLink size={18} />
                        </a>
                        <a
                            href={file.url}
                            download={file.name}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#279da6] hover:bg-[#20838b] text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#279da6]/20"
                        >
                            <Download size={14} />
                            <span>Download</span>
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-shark/40 rounded-xl text-storm-gray hover:text-white transition-all ml-1"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* AI Summary Banner */}
                {summary && (
                    <div className="px-6 py-4 bg-[#279da6]/5 border-b border-[#279da6]/10 flex items-start gap-3 animate-slide-down relative z-10">
                        <div className="mt-0.5 p-1 rounded-md bg-[#279da6]/20 text-[#279da6]">
                            <Sparkles size={12} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-[#279da6] uppercase tracking-widest mb-1">Gemini AI Summary</p>
                            <p className="text-[11px] font-bold text-iron leading-relaxed italic">
                                "{summary}"
                            </p>
                        </div>
                        <div className="text-[#279da6]/40">
                            <Check size={16} />
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-[#09090B]/10 min-h-[400px]">
                    {isImage ? (
                        <div className="relative group">
                            <div className="absolute inset-0 bg-[#279da6]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <img
                                src={displayUrl}
                                alt={file.name}
                                className="relative z-10 max-w-full max-h-[60vh] object-contain rounded-2xl shadow-2xl border border-shark/50"
                            />
                        </div>
                    ) : isPdf ? (
                        <iframe
                            src={displayUrl}
                            className="w-full h-[65vh] rounded-2xl border border-shark/50 shadow-2xl"
                            title={file.name}
                        />
                    ) : isVideo ? (
                        <video
                            src={displayUrl}
                            controls
                            className="max-w-full max-h-[65vh] rounded-2xl shadow-2xl border border-shark/50"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-8 text-center py-20">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#279da6]/20 blur-2xl rounded-full animate-pulse" />
                                <div className="relative z-10 w-24 h-24 rounded-3xl bg-[#18181B] border border-shark flex items-center justify-center text-[#279da6] shadow-2xl">
                                    <FileIcon size={48} />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{file.name}</h4>
                                <p className="text-[10px] text-storm-gray font-black uppercase tracking-[.3em] mb-8">
                                    {file.type || 'System File'} • PREVIEW NOT AVAILABLE
                                </p>
                                <a
                                    href={file.url}
                                    download={file.name}
                                    className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#279da6] hover:bg-[#20838b] text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#279da6]/20 hover:scale-105"
                                >
                                    <Download size={18} />
                                    Download File
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
