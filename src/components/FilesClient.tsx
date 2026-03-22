'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import FilePreviewModal from '@/components/FilePreviewModal';
import { useRouter } from 'next/navigation';
import {
    FolderOpen,
    ChevronRight,
    Search,
    Upload,
    Loader2,
    FileText,
    File as FileIcon,
    Image as ImageIcon,
    Film,
    Music,
    Archive,
    Code,
    Pencil,
    Trash2,
    Download,
    X,
    ArrowLeft,
    RefreshCw,
    FolderPlus,
    Check,
    Sparkles,
    Star,
    Grid3X3,
    List,
    MoreVertical,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import StorageInsights from '@/components/StorageInsights';
import DuplicateDetector from '@/components/DuplicateDetector';

interface StorageItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    mime_type?: string;
    size?: number;
    r2_key?: string;
    preview_url?: string;
    tags?: string[];
    ai_summary?: string;
    ai_category?: string;
    is_starred?: boolean;
    created_at: string;
    updated_at: string;
}

export default function FilesClient() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [items, setItems] = useState<StorageItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Navigation
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
        { id: null, name: 'My Files' }
    ]);
    const currentFolderId = breadcrumbs[breadcrumbs.length - 1].id;

    // Preview
    const [previewFile, setPreviewFile] = useState<StorageItem | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // CRUD
    const [isRenaming, setIsRenaming] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<StorageItem | null>(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [actionMenu, setActionMenu] = useState<string | null>(null);

    // Upload
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI
    const [isAISearching, setIsAISearching] = useState(false);
    const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);

    // Auth redirect
    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.replace('/login');
        }
    }, [user, isAuthLoading, router]);

    // Fetch items
    const fetchItems = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ userId: user.id });
            if (currentFolderId) params.set('folderId', currentFolderId);
            const res = await fetch(`/api/storage/browse?${params}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            setIsLoading(false);
        }
    }, [user, currentFolderId]);

    useEffect(() => {
        if (user) fetchItems();
    }, [user, fetchItems]);

    // Navigation
    const navigateToFolder = (item: StorageItem) => {
        setBreadcrumbs(prev => [...prev, { id: item.id, name: item.name }]);
    };

    const navigateToBreadcrumb = (index: number) => {
        setBreadcrumbs(prev => prev.slice(0, index + 1));
    };

    // Upload
    const handleUpload = async (fileList: FileList | null) => {
        if (!fileList || !user) return;
        setIsUploading(true);
        setIsDragOver(false);

        for (const file of Array.from(fileList)) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('userId', user.id);
                if (currentFolderId) formData.append('folderId', currentFolderId);

                await fetch('/api/storage/browse', { method: 'POST', body: formData });
            } catch (e) {
                console.error('Upload error:', e);
            }
        }

        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchItems();
    };

    // Create folder
    const handleCreateFolder = async () => {
        if (!newFolderName.trim() || !user) return;
        try {
            await fetch('/api/storage/browse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    folderName: newFolderName.trim(),
                    parentId: currentFolderId,
                })
            });
            setIsCreatingFolder(false);
            setNewFolderName('');
            fetchItems();
        } catch (e) {
            console.error('Create folder error:', e);
        }
    };

    // Rename
    const handleRename = async (item: StorageItem) => {
        if (!renameValue.trim()) return;
        try {
            await fetch('/api/storage/browse', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, newName: renameValue.trim(), type: item.type })
            });
            setIsRenaming(null);
            fetchItems();
        } catch (e) {
            console.error('Rename error:', e);
        }
    };

    // Delete
    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await fetch(`/api/storage/browse?id=${deleteTarget.id}&type=${deleteTarget.type}`, { method: 'DELETE' });
            setDeleteTarget(null);
            fetchItems();
        } catch (e) {
            console.error('Delete error:', e);
        }
    };

    // AI Search
    const handleAISearch = async () => {
        if (!searchQuery.trim()) { setAiMatchedIds(null); return; }
        setIsAISearching(true);
        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'search',
                    payload: { query: searchQuery, files: items.map(f => ({ id: f.id, name: f.name, mime_type: f.mime_type })) }
                })
            });
            const data = await res.json();
            if (data.data?.matchedIds) setAiMatchedIds(data.data.matchedIds);
        } catch (e) {
            console.error('AI Search error:', e);
        } finally {
            setIsAISearching(false);
        }
    };

    // File icon
    const getFileIcon = (item: StorageItem) => {
        if (item.type === 'folder') return <FolderOpen size={22} />;
        const mt = item.mime_type || '';
        if (mt.startsWith('image/')) return <ImageIcon size={22} />;
        if (mt.includes('pdf')) return <FileText size={22} />;
        if (mt.startsWith('video/')) return <Film size={22} />;
        if (mt.startsWith('audio/')) return <Music size={22} />;
        if (mt.includes('zip') || mt.includes('rar') || mt.includes('tar')) return <Archive size={22} />;
        if (mt.includes('javascript') || mt.includes('typescript') || mt.includes('json') || mt.includes('html') || mt.includes('css')) return <Code size={22} />;
        return <FileIcon size={22} />;
    };

    const getIconColor = (item: StorageItem) => {
        if (item.type === 'folder') return 'text-[#f59e0b] bg-[#f59e0b]/10';
        const mt = item.mime_type || '';
        if (mt.startsWith('image/')) return 'text-[#22c55e] bg-[#22c55e]/10';
        if (mt.includes('pdf')) return 'text-[#ef4444] bg-[#ef4444]/10';
        if (mt.startsWith('video/')) return 'text-[#a855f7] bg-[#a855f7]/10';
        if (mt.startsWith('audio/')) return 'text-[#ec4899] bg-[#ec4899]/10';
        return 'text-[#6366f1] bg-[#6366f1]/10';
    };

    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
        return `${(bytes / 1073741824).toFixed(1)} GB`;
    };

    const getTypeLabel = (item: StorageItem) => {
        if (item.type === 'folder') return 'Folder';
        const mt = item.mime_type || '';
        if (mt.startsWith('image/')) return mt.replace('image/', '').toUpperCase();
        if (mt.includes('pdf')) return 'PDF';
        if (mt.startsWith('video/')) return 'Video';
        if (mt.startsWith('audio/')) return 'Audio';
        return mt.split('/').pop()?.toUpperCase() || 'File';
    };

    // Filtered items
    const filteredItems = items.filter(item => {
        if (aiMatchedIds) return aiMatchedIds.includes(item.id);
        if (!searchQuery) return true;
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Drag & drop
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
    const handleDragLeave = () => setIsDragOver(false);
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); handleUpload(e.dataTransfer.files); };

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#000]">
                <Loader2 size={28} className="animate-spin text-[#6366f1]" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#000] text-white font-sans overflow-hidden">
            <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="h-14 flex items-center justify-between px-6 border-b border-[#1e1e1e] bg-[#0a0a0a] shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        {breadcrumbs.length > 1 && (
                            <button onClick={() => navigateToBreadcrumb(breadcrumbs.length - 2)} className="p-1 text-[#71717a] hover:text-white transition-colors mr-1">
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        {breadcrumbs.map((crumb, i) => (
                            <div key={i} className="flex items-center gap-2">
                                {i > 0 && <ChevronRight size={14} className="text-[#3f3f46]" />}
                                <button
                                    onClick={() => navigateToBreadcrumb(i)}
                                    className={`text-sm font-medium transition-colors truncate max-w-[150px] ${i === breadcrumbs.length - 1 ? 'text-white' : 'text-[#71717a] hover:text-[#a1a1aa]'}`}
                                >
                                    {crumb.name}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3f3f46]" size={15} />
                            <input
                                type="text"
                                placeholder="Search files with AI..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setAiMatchedIds(null); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                                className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg py-1.5 pl-9 pr-9 text-sm text-white placeholder:text-[#3f3f46] focus:outline-none focus:border-[#6366f1]/40 transition-all"
                            />
                            {aiMatchedIds ? (
                                <button onClick={() => { setAiMatchedIds(null); setSearchQuery(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#ef4444]">
                                    <X size={14} />
                                </button>
                            ) : searchQuery && (
                                <button onClick={handleAISearch} disabled={isAISearching} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6366f1]">
                                    {isAISearching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                </button>
                            )}
                        </div>

                        <div className="flex items-center border border-[#1e1e1e] rounded-lg overflow-hidden">
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 ${viewMode === 'grid' ? 'bg-[#6366f1]/10 text-[#818cf8]' : 'text-[#71717a] hover:text-white'} transition-all`}>
                                <Grid3X3 size={16} />
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-1.5 ${viewMode === 'list' ? 'bg-[#6366f1]/10 text-[#818cf8]' : 'text-[#71717a] hover:text-white'} transition-all`}>
                                <List size={16} />
                            </button>
                        </div>

                        <button onClick={fetchItems} className="p-1.5 text-[#71717a] hover:text-white border border-[#1e1e1e] rounded-lg transition-all">
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Main */}
                <main
                    className="flex-1 overflow-y-auto custom-scrollbar relative"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* Drag overlay */}
                    {isDragOver && (
                        <div className="absolute inset-0 z-40 bg-[#6366f1]/10 border-2 border-dashed border-[#6366f1] rounded-xl m-4 flex items-center justify-center animate-fade-in">
                            <div className="text-center">
                                <Upload size={48} className="text-[#6366f1] mx-auto mb-3" />
                                <p className="text-lg font-semibold text-white">Drop files here to upload</p>
                            </div>
                        </div>
                    )}

                    <div className="p-6">
                        {/* AI Insights */}
                        <StorageInsights
                            fileStats={{
                                totalFiles: items.filter(i => i.type === 'file').length,
                                totalSize: items.reduce((acc, f) => acc + (f.size || 0), 0),
                                typeCounts: items.reduce((acc: Record<string, number>, f) => {
                                    if (f.type === 'file') {
                                        const type = getTypeLabel(f);
                                        acc[type] = (acc[type] || 0) + 1;
                                    }
                                    return acc;
                                }, {})
                            }}
                        />

                        {/* Duplicate Detector */}
                        <DuplicateDetector
                            files={items.filter(i => i.type === 'file').map(f => ({ id: f.id, name: f.name, mimeType: f.mime_type || '', size: f.size || null }))}
                            onDeleteFile={(fileId) => {
                                const target = items.find(d => d.id === fileId);
                                if (target) setDeleteTarget(target);
                            }}
                        />

                        {/* Action bar */}
                        <div className="flex items-center gap-2 mb-5">
                            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => handleUpload(e.target.files)} />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#6366f1] text-white text-sm font-medium hover:bg-[#818cf8] transition-all disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                Upload
                            </button>
                            <button
                                onClick={() => setIsCreatingFolder(true)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1e1e1e] text-[#a1a1aa] text-sm font-medium hover:bg-[#111] hover:text-white transition-all"
                            >
                                <FolderPlus size={16} />
                                New Folder
                            </button>
                        </div>

                        {/* New folder input */}
                        {isCreatingFolder && (
                            <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#6366f1]/30 rounded-xl mb-5 animate-slide-down">
                                <FolderPlus size={18} className="text-[#6366f1] shrink-0" />
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setIsCreatingFolder(false); }}
                                    className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                                    placeholder="Folder name..."
                                    autoFocus
                                />
                                <button onClick={handleCreateFolder} className="p-1.5 bg-[#6366f1]/10 text-[#6366f1] rounded-lg hover:bg-[#6366f1]/20 transition-all">
                                    <Check size={16} />
                                </button>
                                <button onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }} className="p-1.5 text-[#71717a] hover:text-white transition-all">
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        {isLoading && items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-3">
                                <Loader2 size={28} className="animate-spin text-[#6366f1]" />
                                <p className="text-sm text-[#71717a]">Loading files...</p>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-[#111] border border-[#1e1e1e] flex items-center justify-center mb-4">
                                    <FolderOpen size={28} className="text-[#3f3f46]" />
                                </div>
                                <p className="text-sm font-medium text-[#a1a1aa] mb-1">
                                    {searchQuery ? 'No files match your search' : 'This folder is empty'}
                                </p>
                                <p className="text-xs text-[#71717a]">
                                    {searchQuery ? 'Try a different search term' : 'Upload files or create a folder to get started'}
                                </p>
                            </div>
                        ) : viewMode === 'grid' ? (
                            /* Grid View */
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                                {filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group relative flex flex-col items-center gap-3 p-4 rounded-xl border border-[#1e1e1e] hover:border-[#2a2a2a] bg-[#0a0a0a] hover:bg-[#111] transition-all cursor-pointer"
                                        onClick={() => item.type === 'folder' ? navigateToFolder(item) : (setPreviewFile(item), setIsPreviewOpen(true))}
                                    >
                                        {/* Icon */}
                                        <div className={`p-3 rounded-xl ${getIconColor(item)} transition-transform group-hover:scale-105`}>
                                            {getFileIcon(item)}
                                        </div>

                                        {/* Name */}
                                        {isRenaming === item.id ? (
                                            <div className="w-full" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="text"
                                                    value={renameValue}
                                                    onChange={e => setRenameValue(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') handleRename(item); if (e.key === 'Escape') setIsRenaming(null); }}
                                                    autoFocus
                                                    className="w-full bg-[#111] border border-[#6366f1]/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none text-center"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full text-center min-w-0">
                                                <p className="text-xs font-medium text-white truncate">{item.name}</p>
                                                <div className="flex items-center justify-center gap-1.5 mt-1">
                                                    <span className="text-[10px] text-[#71717a]">{getTypeLabel(item)}</span>
                                                    {item.size ? (
                                                        <>
                                                            <span className="text-[#2a2a2a]">&middot;</span>
                                                            <span className="text-[10px] text-[#71717a]">{formatSize(item.size)}</span>
                                                        </>
                                                    ) : null}
                                                </div>
                                                {/* AI tags */}
                                                {item.tags && item.tags.length > 0 && (
                                                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                                                        {item.ai_category && (
                                                            <span className="px-1.5 py-0.5 rounded bg-[#6366f1]/10 text-[#818cf8] text-[9px] font-medium">
                                                                {item.ai_category}
                                                            </span>
                                                        )}
                                                        {item.tags.slice(0, 2).map(tag => (
                                                            <span key={tag} className="px-1.5 py-0.5 rounded bg-[#111] text-[#71717a] text-[9px]">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === item.id ? null : item.id); }}
                                                className="p-1 rounded-lg bg-[#111] border border-[#1e1e1e] text-[#71717a] hover:text-white transition-all"
                                            >
                                                <MoreVertical size={14} />
                                            </button>
                                            {actionMenu === item.id && (
                                                <div className="absolute right-0 top-8 bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl shadow-2xl py-1 min-w-[140px] z-20 animate-scale-in" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => { setRenameValue(item.name); setIsRenaming(item.id); setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#111] transition-all">
                                                        <Pencil size={14} /> Rename
                                                    </button>
                                                    {item.type === 'file' && item.preview_url && (
                                                        <a href={item.preview_url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#111] transition-all">
                                                            <Download size={14} /> Download
                                                        </a>
                                                    )}
                                                    <button onClick={() => { setDeleteTarget(item); setActionMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#ef4444]/10 transition-all">
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Star indicator */}
                                        {item.is_starred && (
                                            <div className="absolute top-2 left-2">
                                                <Star size={12} className="text-[#f59e0b] fill-[#f59e0b]" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* List View */
                            <div className="border border-[#1e1e1e] rounded-xl overflow-hidden">
                                <div className="grid grid-cols-[1fr_100px_120px_80px] px-4 py-2 bg-[#0a0a0a] border-b border-[#1e1e1e] text-xs text-[#71717a] font-medium">
                                    <span>Name</span>
                                    <span>Type</span>
                                    <span>Size</span>
                                    <span className="text-right">Actions</span>
                                </div>
                                {filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="grid grid-cols-[1fr_100px_120px_80px] px-4 py-2.5 border-b border-[#1e1e1e] last:border-b-0 hover:bg-[#0a0a0a] transition-all cursor-pointer group items-center"
                                        onClick={() => item.type === 'folder' ? navigateToFolder(item) : (setPreviewFile(item), setIsPreviewOpen(true))}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-1.5 rounded-lg ${getIconColor(item)}`}>
                                                {getFileIcon(item)}
                                            </div>
                                            <span className="text-sm text-white truncate">{item.name}</span>
                                            {item.is_starred && <Star size={12} className="text-[#f59e0b] fill-[#f59e0b] shrink-0" />}
                                            {item.tags && item.tags.length > 0 && (
                                                <div className="flex gap-1 shrink-0">
                                                    {item.tags.slice(0, 2).map(tag => (
                                                        <span key={tag} className="px-1.5 py-0.5 rounded bg-[#111] text-[#71717a] text-[9px]">#{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-[#71717a]">{getTypeLabel(item)}</span>
                                        <span className="text-xs text-[#71717a]">{formatSize(item.size)}</span>
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => { setRenameValue(item.name); setIsRenaming(item.id); }} className="p-1 text-[#71717a] hover:text-[#6366f1] transition-all">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => setDeleteTarget(item)} className="p-1 text-[#71717a] hover:text-[#ef4444] transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
                        <div className="w-12 h-12 rounded-xl bg-[#ef4444]/10 flex items-center justify-center text-[#ef4444] mb-4 mx-auto">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-white text-center mb-1">Delete {deleteTarget.type}?</h3>
                        <p className="text-sm text-[#71717a] text-center mb-6">
                            &ldquo;{deleteTarget.name}&rdquo; will be permanently deleted.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-[#111] border border-[#1e1e1e] text-white text-sm font-medium hover:bg-[#181818] transition-all">
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-[#ef4444] text-white text-sm font-medium hover:bg-[#dc2626] transition-all">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Preview */}
            <FilePreviewModal
                isOpen={isPreviewOpen}
                onClose={() => { setIsPreviewOpen(false); setPreviewFile(null); }}
                file={previewFile ? {
                    name: previewFile.name,
                    id: previewFile.id,
                    url: previewFile.preview_url || '',
                    type: previewFile.mime_type || '',
                } : null}
            />
        </div>
    );
}
