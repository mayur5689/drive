'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import FilePreviewModal from '@/components/FilePreviewModal';
import {
    FolderOpen,
    FolderClosed,
    ChevronRight,
    Search,
    Upload,
    Loader2,
    FileText,
    File as FileIcon,
    Image as ImageIcon,
    Film,
    MoreHorizontal,
    Pencil,
    Trash2,
    Download,
    X,
    Home,
    ArrowLeft,
    HardDrive,
    FolderInput,
    Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface FileItem {
    message_id: string;
    attachment_index: number;
    name: string;
    url: string;
    type: string;
    uploaded_at: string;
    uploaded_by: string;
}

interface RequestFolder {
    request_id: string;
    request_title: string;
    production: FileItem[];
    distributed: FileItem[];
}

interface ClientFolder {
    client_id: string;
    client_name: string;
    client_full_name: string;
    requests: RequestFolder[];
}

type BreadcrumbLevel = 'root' | 'client' | 'request' | 'folder';

export default function FilesPage() {
    const { profile, viewAsProfile, isImpersonating } = useAuth();
    const displayProfile = viewAsProfile || profile;
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [fileTree, setFileTree] = useState<ClientFolder[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Navigation state
    const [currentLevel, setCurrentLevel] = useState<BreadcrumbLevel>('root');
    const [selectedClient, setSelectedClient] = useState<ClientFolder | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<RequestFolder | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<'production' | 'distributed' | null>(null);

    // Preview
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // CRUD state
    const [contextMenuFile, setContextMenuFile] = useState<FileItem | null>(null);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

    // Upload
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isSuperAdmin = displayProfile?.role === 'super_admin';
    const isAdmin = displayProfile?.role === 'admin' || isSuperAdmin;
    const isTeamMember = displayProfile?.role === 'team_member';

    const fetchFiles = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (displayProfile?.role) params.set('role', displayProfile.role);
            if (displayProfile?.id) params.set('user_id', displayProfile.id);

            const res = await fetch(`/api/files?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setFileTree(data);
                return data;
            }
        } catch (error) {
            console.error('Error fetching files:', error);
        } finally {
            setIsLoading(false);
        }
        return null;
    };

    useEffect(() => {
        fetchFiles();
    }, [displayProfile?.id]);

    // Close context menu on click outside
    useEffect(() => {
        const handler = () => setContextMenuFile(null);
        window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
    }, []);

    // ─── Navigation ───
    const navigateToClient = (client: ClientFolder) => {
        setSelectedClient(client);
        setSelectedRequest(null);
        setSelectedFolder(null);
        setCurrentLevel('client');
    };

    const navigateToRequest = (request: RequestFolder) => {
        setSelectedRequest(request);
        setSelectedFolder(null);
        setCurrentLevel('request');
    };

    const navigateToFolder = (folder: 'production' | 'distributed') => {
        setSelectedFolder(folder);
        setCurrentLevel('folder');
    };

    const navigateBack = () => {
        if (currentLevel === 'folder') {
            setSelectedFolder(null);
            setCurrentLevel('request');
        } else if (currentLevel === 'request') {
            setSelectedRequest(null);
            setCurrentLevel('client');
        } else if (currentLevel === 'client') {
            setSelectedClient(null);
            setCurrentLevel('root');
        }
    };

    // ─── CRUD Handlers ───
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedRequest || !selectedFolder || !displayProfile) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('request_id', selectedRequest.request_id);
            formData.append('folder', selectedFolder);
            formData.append('sender_id', displayProfile.id);

            const res = await fetch('/api/files', { method: 'POST', body: formData });
            if (res.ok) {
                const newData = await fetchFiles();
                // Re-navigate to current position using fresh data
                if (newData && selectedClient) {
                    const updatedClient = newData.find((c: any) => c.client_id === selectedClient.client_id);
                    if (updatedClient) {
                        setSelectedClient(updatedClient);
                        if (selectedRequest) {
                            const updatedRequest = updatedClient.requests.find((r: any) => r.request_id === selectedRequest.request_id);
                            if (updatedRequest) setSelectedRequest(updatedRequest);
                        }
                    }
                }
            } else {
                const err = await res.json();
                alert(`Upload failed: ${err.error}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRename = async () => {
        if (!contextMenuFile || !renameValue.trim()) return;

        try {
            const res = await fetch('/api/files', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message_id: contextMenuFile.message_id,
                    attachment_index: contextMenuFile.attachment_index,
                    new_name: renameValue.trim()
                })
            });

            if (res.ok) {
                setIsRenaming(false);
                setContextMenuFile(null);
                const newData = await fetchFiles();

                // Refresh local navigation state
                if (newData && selectedClient) {
                    const updatedClient = newData.find((c: any) => c.client_id === selectedClient.client_id);
                    if (updatedClient) {
                        setSelectedClient(updatedClient);
                        if (selectedRequest) {
                            const updatedRequest = updatedClient.requests.find((r: any) => r.request_id === selectedRequest.request_id);
                            if (updatedRequest) setSelectedRequest(updatedRequest);
                        }
                    }
                }
            } else {
                const err = await res.json();
                alert(`Rename failed: ${err.error}`);
            }
        } catch (error) {
            console.error('Rename error:', error);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            const res = await fetch(
                `/api/files?message_id=${deleteTarget.message_id}&attachment_index=${deleteTarget.attachment_index}`,
                { method: 'DELETE' }
            );

            if (res.ok) {
                setDeleteTarget(null);
                setIsDeleting(false);
                const newData = await fetchFiles();

                // Refresh local navigation state
                if (newData && selectedClient) {
                    const updatedClient = newData.find((c: any) => c.client_id === selectedClient.client_id);
                    if (updatedClient) {
                        setSelectedClient(updatedClient);
                        if (selectedRequest) {
                            const updatedRequest = updatedClient.requests.find((r: any) => r.request_id === selectedRequest.request_id);
                            if (updatedRequest) setSelectedRequest(updatedRequest);
                        }
                    }
                }
            } else {
                const err = await res.json();
                alert(`Delete failed: ${err.error}`);
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuFile(file);
        setContextMenuPos({ x: e.clientX, y: e.clientY });
    };

    // ─── File type icon helper ───
    const getFileIcon = (type: string) => {
        if (type?.startsWith('image/')) return <ImageIcon size={20} className="text-emerald-400" />;
        if (type?.includes('pdf')) return <FileText size={20} className="text-rose-400" />;
        if (type?.startsWith('video/')) return <Film size={20} className="text-purple-400" />;
        return <FileIcon size={20} className="text-blue-400" />;
    };

    const getFileTypeLabel = (type: string) => {
        if (type?.startsWith('image/')) return type.replace('image/', '').toUpperCase();
        if (type?.includes('pdf')) return 'PDF';
        if (type?.startsWith('video/')) return type.replace('video/', '').toUpperCase();
        const ext = type?.split('/').pop()?.toUpperCase();
        return ext || 'FILE';
    };

    // ─── Search filter ───
    const filterFiles = (files: FileItem[]) => {
        if (!searchQuery) return files;
        return files.filter(f =>
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.uploaded_by.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    // ─── Get current files for display ───
    const getCurrentFiles = (): FileItem[] => {
        if (currentLevel === 'folder' && selectedRequest && selectedFolder) {
            return filterFiles(selectedRequest[selectedFolder]);
        }
        return [];
    };

    // ─── Count helpers ───
    const getClientFileCount = (client: ClientFolder) => {
        return client.requests.reduce((acc, r) => acc + r.production.length + r.distributed.length, 0);
    };

    const getRequestFileCount = (request: RequestFolder) => {
        return request.production.length + request.distributed.length;
    };

    // ─── Check if user can upload to current folder ───
    const canUpload = () => {
        if (currentLevel !== 'folder') return false;
        if (isSuperAdmin) return true;
        if (isAdmin) return true;
        if (isTeamMember && selectedFolder === 'production') return true;
        return false;
    };

    // ─── Filtered tree for search at root ───
    const filteredTree = searchQuery
        ? fileTree.filter(c =>
            c.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.client_full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.requests.some(r =>
                r.request_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                [...r.production, ...r.distributed].some(f =>
                    f.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
            )
        )
        : fileTree;

    return (
        <div className={`flex h-screen bg-[#09090B] text-iron font-sans overflow-hidden transition-all duration-500 ${isImpersonating ? 'p-1.5' : ''}`} style={isImpersonating ? { backgroundColor: '#0f2b1a' } : undefined}>
            <Sidebar isCollapsed={isSidebarCollapsed} />

            <div className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative">
                <div className={`flex-1 flex flex-col min-w-0 bg-[#121214] rounded-t-2xl overflow-hidden border-t border-l border-r mt-6 mr-6 transition-all duration-500 ${isImpersonating ? 'border-[#22c55e]/60 shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 'border-shark'}`}>
                    <Header
                        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        label="Files"
                        labelIcon={<HardDrive size={16} className="text-santas-gray" />}
                    />

                    <main className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="px-6 pb-6 pt-2">
                            <div className="bg-[#18181B] border border-shark rounded-2xl p-6 min-h-[calc(100vh-160px)] shadow-2xl">

                                {/* Breadcrumb + Search */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-sm">
                                        {currentLevel !== 'root' && (
                                            <button
                                                onClick={navigateBack}
                                                className="p-1.5 hover:bg-shark/40 rounded-lg text-storm-gray hover:text-white transition-all"
                                            >
                                                <ArrowLeft size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { setCurrentLevel('root'); setSelectedClient(null); setSelectedRequest(null); setSelectedFolder(null); }}
                                            className={`flex items-center gap-1.5 font-bold transition-all ${currentLevel === 'root' ? 'text-[#279da6]' : 'text-storm-gray hover:text-iron cursor-pointer'}`}
                                        >
                                            <HardDrive size={14} />
                                            <span>Files</span>
                                        </button>

                                        {selectedClient && (
                                            <>
                                                <ChevronRight size={14} className="text-storm-gray" />
                                                <button
                                                    onClick={() => { setCurrentLevel('client'); setSelectedRequest(null); setSelectedFolder(null); }}
                                                    className={`font-bold transition-all ${currentLevel === 'client' ? 'text-[#279da6]' : 'text-storm-gray hover:text-iron'}`}
                                                >
                                                    {selectedClient.client_name}
                                                </button>
                                            </>
                                        )}

                                        {selectedRequest && (
                                            <>
                                                <ChevronRight size={14} className="text-storm-gray" />
                                                <button
                                                    onClick={() => { setCurrentLevel('request'); setSelectedFolder(null); }}
                                                    className={`font-bold transition-all truncate max-w-[200px] ${currentLevel === 'request' ? 'text-[#279da6]' : 'text-storm-gray hover:text-iron'}`}
                                                >
                                                    {selectedRequest.request_title}
                                                </button>
                                            </>
                                        )}

                                        {selectedFolder && (
                                            <>
                                                <ChevronRight size={14} className="text-storm-gray" />
                                                <span className="font-bold text-[#279da6] capitalize">
                                                    {selectedFolder}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="relative w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-santas-gray" size={14} />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search files..."
                                                className="w-full bg-[#09090B] border border-shark/50 rounded-lg py-1.5 pl-9 pr-4 text-[11px] text-iron placeholder:text-storm-gray focus:outline-none focus:border-[#279da6]/40 transition-all font-bold"
                                            />
                                        </div>

                                        {canUpload() && (
                                            <>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleUpload}
                                                    className="hidden"
                                                />
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploading}
                                                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#279da6] hover:bg-[#20838b] text-white text-[11px] font-bold transition-all shadow-lg shadow-[#279da6]/20 disabled:opacity-50"
                                                >
                                                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                                    <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                                        <Loader2 size={32} className="animate-spin text-[#279da6]" />
                                        <p className="text-[10px] font-black text-storm-gray uppercase tracking-widest">Loading files...</p>
                                    </div>
                                ) : currentLevel === 'root' ? (
                                    // ─── Client Folders ───
                                    filteredTree.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                                            <FolderOpen size={48} className="text-storm-gray mb-4" />
                                            <p className="text-xs font-bold text-iron uppercase mb-1">No files yet</p>
                                            <p className="text-[10px] text-storm-gray">Files shared in request chats will appear here automatically.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {filteredTree.map(client => (
                                                <button
                                                    key={client.client_id}
                                                    onClick={() => navigateToClient(client)}
                                                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-shark/40 hover:border-[#279da6]/30 bg-[#09090B]/40 hover:bg-[#279da6]/5 transition-all text-center"
                                                >
                                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                                                        <FolderClosed size={28} />
                                                    </div>
                                                    <div className="min-w-0 w-full">
                                                        <p className="text-xs font-bold text-iron truncate">{client.client_name}</p>
                                                        <p className="text-[10px] text-storm-gray font-bold">{getClientFileCount(client)} files</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )
                                ) : currentLevel === 'client' && selectedClient ? (
                                    // ─── Request Folders ───
                                    selectedClient.requests.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                                            <FolderOpen size={48} className="text-storm-gray mb-4" />
                                            <p className="text-xs font-bold text-iron uppercase">No requests with files</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {selectedClient.requests.map(req => (
                                                <button
                                                    key={req.request_id}
                                                    onClick={() => navigateToRequest(req)}
                                                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-shark/40 hover:border-[#279da6]/30 bg-[#09090B]/40 hover:bg-[#279da6]/5 transition-all text-center"
                                                >
                                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                                        <FolderClosed size={28} />
                                                    </div>
                                                    <div className="min-w-0 w-full">
                                                        <p className="text-xs font-bold text-iron truncate">{req.request_title}</p>
                                                        <p className="text-[10px] text-storm-gray font-bold">{getRequestFileCount(req)} files</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )
                                ) : currentLevel === 'request' && selectedRequest ? (
                                    // ─── Production / Distributed Folders ───
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        <button
                                            onClick={() => navigateToFolder('production')}
                                            className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-shark/40 hover:border-emerald-500/30 bg-[#09090B]/40 hover:bg-emerald-500/5 transition-all text-center"
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                                <FolderInput size={32} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-iron">Production</p>
                                                <p className="text-[10px] text-storm-gray font-bold mt-0.5">Files sent to client</p>
                                                <p className="text-[10px] text-emerald-400 font-bold mt-1">{selectedRequest.production.length} files</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => navigateToFolder('distributed')}
                                            className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-shark/40 hover:border-violet-500/30 bg-[#09090B]/40 hover:bg-violet-500/5 transition-all text-center"
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                                                <FolderInput size={32} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-iron">Distributed</p>
                                                <p className="text-[10px] text-storm-gray font-bold mt-0.5">Files from client</p>
                                                <p className="text-[10px] text-violet-400 font-bold mt-1">{selectedRequest.distributed.length} files</p>
                                            </div>
                                        </button>
                                    </div>
                                ) : currentLevel === 'folder' ? (
                                    // ─── File List ───
                                    (() => {
                                        const files = getCurrentFiles();
                                        return files.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                                                <FileIcon size={48} className="text-storm-gray mb-4" />
                                                <p className="text-xs font-bold text-iron uppercase mb-1">No files in this folder</p>
                                                {canUpload() && (
                                                    <p className="text-[10px] text-storm-gray">Click "Upload" to add files here.</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="border border-shark/60 rounded-xl overflow-hidden bg-black/20">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-shark text-storm-gray text-[10px] uppercase font-bold tracking-wider bg-shark/20">
                                                            <th className="px-5 py-3 w-10">
                                                                <div className="w-4 h-4" />
                                                            </th>
                                                            <th className="px-5 py-3">Name</th>
                                                            <th className="px-5 py-3 w-24">Type</th>
                                                            <th className="px-5 py-3 w-36">Uploaded By</th>
                                                            <th className="px-5 py-3 w-40">Date</th>
                                                            {isSuperAdmin && <th className="px-5 py-3 w-20">Actions</th>}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-shark/60">
                                                        {files.map((file, idx) => (
                                                            <tr
                                                                key={`${file.message_id}-${file.attachment_index}`}
                                                                className="hover:bg-shark/10 transition-colors group cursor-pointer"
                                                                onClick={() => { setPreviewFile(file); setIsPreviewOpen(true); }}
                                                            >
                                                                <td className="px-5 py-3">
                                                                    {getFileIcon(file.type)}
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    {isRenaming && contextMenuFile?.message_id === file.message_id && contextMenuFile?.attachment_index === file.attachment_index ? (
                                                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                                            <input
                                                                                type="text"
                                                                                value={renameValue}
                                                                                onChange={e => setRenameValue(e.target.value)}
                                                                                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setIsRenaming(false); setContextMenuFile(null); } }}
                                                                                autoFocus
                                                                                className="bg-[#09090B] border border-[#279da6]/40 rounded-lg px-2 py-1 text-xs font-bold text-iron focus:outline-none w-64"
                                                                            />
                                                                            <button onClick={handleRename} className="p-1 rounded bg-[#279da6]/20 text-[#279da6] hover:bg-[#279da6]/30">
                                                                                <Check size={14} />
                                                                            </button>
                                                                            <button onClick={() => { setIsRenaming(false); setContextMenuFile(null); }} className="p-1 rounded bg-shark/40 text-storm-gray hover:text-white">
                                                                                <X size={14} />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[11px] font-bold text-iron group-hover:text-[#279da6] transition-colors">{file.name}</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    <span className="text-[10px] font-bold text-storm-gray uppercase tracking-wider bg-shark/30 px-2 py-0.5 rounded-md">
                                                                        {getFileTypeLabel(file.type)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-3 text-[11px] font-bold text-storm-gray">{file.uploaded_by}</td>
                                                                <td className="px-5 py-3 text-[10px] text-storm-gray">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-iron">{new Date(file.uploaded_at).toLocaleDateString()}</span>
                                                                        <span className="opacity-60">{new Date(file.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </div>
                                                                </td>
                                                                {isSuperAdmin && (
                                                                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setContextMenuFile(file);
                                                                                    setRenameValue(file.name);
                                                                                    setIsRenaming(true);
                                                                                }}
                                                                                className="p-1.5 rounded-lg hover:bg-[#279da6]/10 text-storm-gray hover:text-[#279da6] transition-all"
                                                                                title="Rename"
                                                                            >
                                                                                <Pencil size={13} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => { setDeleteTarget(file); setIsDeleting(true); }}
                                                                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-storm-gray hover:text-rose-500 transition-all"
                                                                                title="Delete"
                                                                            >
                                                                                <Trash2 size={13} />
                                                                            </button>
                                                                            <a
                                                                                href={file.url}
                                                                                download={file.name}
                                                                                onClick={e => e.stopPropagation()}
                                                                                className="p-1.5 rounded-lg hover:bg-shark/40 text-storm-gray hover:text-white transition-all"
                                                                                title="Download"
                                                                            >
                                                                                <Download size={13} />
                                                                            </a>
                                                                        </div>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    })()
                                ) : null}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* File Preview Modal */}
            <FilePreviewModal
                isOpen={isPreviewOpen}
                onClose={() => { setIsPreviewOpen(false); setPreviewFile(null); }}
                file={previewFile}
            />

            {/* Delete Confirmation Modal */}
            {isDeleting && deleteTarget && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#18181B] border border-shark rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-slide-up">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <Trash2 size={24} />
                            </div>
                            <button onClick={() => { setIsDeleting(false); setDeleteTarget(null); }} className="text-storm-gray hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-iron mb-2">Delete file?</h2>
                        <p className="text-storm-gray text-sm mb-2">
                            Are you sure you want to delete <span className="font-bold text-iron">"{deleteTarget.name}"</span>?
                        </p>
                        <p className="text-rose-400 text-xs font-bold mb-8">This action cannot be undone.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleDelete} className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm transition-all">
                                Yes, Delete
                            </button>
                            <button onClick={() => { setIsDeleting(false); setDeleteTarget(null); }} className="w-full bg-shark/50 hover:bg-shark text-iron py-3 rounded-xl font-bold text-sm transition-all">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
