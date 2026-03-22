'use client';

import { useState, useEffect } from 'react';
import { Copy, ChevronDown, ChevronUp, Trash2, AlertTriangle, X, Zap } from 'lucide-react';

interface DuplicateGroup {
    group: string;
    files: { id: string; name: string; size: number | null; mimeType: string }[];
    reason: string;
}

interface DuplicateDetectorProps {
    files: { id: string; name: string; mimeType: string; size: number | null }[];
    onDeleteFile?: (fileId: string) => void;
}

function normalizeName(name: string): string {
    const dotIdx = name.lastIndexOf('.');
    const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
    const ext = dotIdx > 0 ? name.slice(dotIdx).toLowerCase() : '';

    const normalized = base
        .toLowerCase()
        .replace(/[\s_-]+/g, ' ')
        .replace(/\s*\(\d+\)\s*/g, '')
        .replace(/\s*copy\s*/gi, '')
        .replace(/\s*v\d+\s*/gi, '')
        .replace(/\s*final\s*/gi, '')
        .replace(/\s*old\s*/gi, '')
        .replace(/\s*new\s*/gi, '')
        .replace(/\s*backup\s*/gi, '')
        .replace(/\s*draft\s*/gi, '')
        .replace(/\s*edited\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    return normalized + ext;
}

function similarity(a: string, b: string): number {
    if (a === b) return 1;
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    if (longer.length === 0) return 1;
    if (longer.includes(shorter)) return shorter.length / longer.length;

    const aChars = new Set(a.split(''));
    const bChars = new Set(b.split(''));
    let overlap = 0;
    aChars.forEach(c => { if (bChars.has(c)) overlap++; });
    return overlap / Math.max(aChars.size, bChars.size);
}

function detectDuplicates(files: DuplicateDetectorProps['files']): DuplicateGroup[] {
    if (files.length < 2) return [];

    const groups: Map<string, DuplicateGroup> = new Map();
    const assigned = new Set<string>();

    for (let i = 0; i < files.length; i++) {
        if (assigned.has(files[i].id)) continue;
        const normI = normalizeName(files[i].name);
        const matches = [files[i]];

        for (let j = i + 1; j < files.length; j++) {
            if (assigned.has(files[j].id)) continue;
            const normJ = normalizeName(files[j].name);

            const isMatch =
                normI === normJ ||
                similarity(normI, normJ) > 0.85 ||
                files[i].name.toLowerCase() === files[j].name.toLowerCase() ||
                (files[i].size && files[j].size &&
                    files[i].size === files[j].size &&
                    files[i].mimeType === files[j].mimeType &&
                    similarity(normI, normJ) > 0.6);

            if (isMatch) {
                matches.push(files[j]);
                assigned.add(files[j].id);
            }
        }

        if (matches.length >= 2) {
            assigned.add(files[i].id);
            const ext = files[i].name.split('.').pop()?.toUpperCase() || 'FILE';
            groups.set(normI, {
                group: `Similar ${ext} files: ${files[i].name.slice(0, 30)}...`,
                files: matches.map(f => ({ id: f.id, name: f.name, size: f.size, mimeType: f.mimeType })),
                reason: matches.length === 2 && matches[0].name.toLowerCase() === matches[1].name.toLowerCase()
                    ? 'Identical file names'
                    : matches[0].size && matches[1].size && matches[0].size === matches[1].size
                        ? 'Same file size — likely duplicates'
                        : 'Very similar names — possibly different versions'
            });
        }
    }

    return Array.from(groups.values());
}

function formatSize(bytes: number | null): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DuplicateDetector({ files, onDeleteFile }: DuplicateDetectorProps) {
    const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
    const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        setDuplicates(detectDuplicates(files));
        setDismissed(false);
    }, [files]);

    if (dismissed || files.length < 2 || duplicates.length === 0) return null;

    return (
        <div className="mb-5 animate-slide-up">
            <div className="bg-[#f59e0b]/5 border border-[#f59e0b]/15 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#f59e0b]/10">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b]">
                            <AlertTriangle size={16} />
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-[#f59e0b]">
                                {duplicates.length} Duplicate Group{duplicates.length > 1 ? 's' : ''} Found
                            </h4>
                            <p className="text-[10px] text-[#f59e0b]/60">
                                {duplicates.reduce((sum, g) => sum + g.files.length, 0)} files could be cleaned up
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setDismissed(true)} className="text-[#f59e0b]/40 hover:text-[#f59e0b] p-1 transition-colors">
                        <X size={14} />
                    </button>
                </div>

                <div className="divide-y divide-[#f59e0b]/10">
                    {duplicates.map((group, i) => (
                        <div key={i} className="px-4">
                            <button
                                onClick={() => setExpandedGroup(expandedGroup === i ? null : i)}
                                className="w-full flex items-center justify-between py-3 text-left group"
                            >
                                <div className="flex items-center gap-2">
                                    <Copy size={14} className="text-[#f59e0b]/50" />
                                    <span className="text-xs font-medium text-[#a1a1aa] group-hover:text-white transition-colors truncate">
                                        {group.group}
                                    </span>
                                    <span className="text-[10px] text-[#71717a] bg-[#111] px-1.5 py-0.5 rounded-full">
                                        {group.files.length}
                                    </span>
                                </div>
                                {expandedGroup === i ? <ChevronUp size={14} className="text-[#71717a]" /> : <ChevronDown size={14} className="text-[#71717a]" />}
                            </button>

                            {expandedGroup === i && (
                                <div className="pb-3 pl-6 space-y-1.5 animate-slide-down">
                                    {group.files.map((file, j) => (
                                        <div key={j} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e]">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-xs text-white truncate max-w-[250px]">{file.name}</span>
                                                <span className="text-[10px] text-[#71717a] shrink-0">{formatSize(file.size)}</span>
                                            </div>
                                            {onDeleteFile && (
                                                <button
                                                    onClick={() => onDeleteFile(file.id)}
                                                    className="p-1 rounded text-[#71717a] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all shrink-0"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <p className="text-[10px] text-[#f59e0b]/50 mt-1.5 pl-1">{group.reason}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
