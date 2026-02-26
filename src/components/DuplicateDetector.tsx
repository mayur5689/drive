'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Loader2, ChevronDown, ChevronUp, Trash2, AlertTriangle, CheckCircle2, X, Zap } from 'lucide-react';

interface DuplicateGroup {
    group: string;
    files: { id: string; name: string; size: number | null; mimeType: string }[];
    reason: string;
}

interface DuplicateDetectorProps {
    files: { id: string; name: string; mimeType: string; size: number | null }[];
    onDeleteFile?: (fileId: string, isFolder: boolean) => void;
}

/**
 * Normalize a file name for comparison:
 * Strips copy markers like (1), (2), _v2, _final, _copy, -copy, spaces, and lowercases.
 */
function normalizeName(name: string): string {
    // Remove file extension
    const dotIdx = name.lastIndexOf('.');
    const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
    const ext = dotIdx > 0 ? name.slice(dotIdx).toLowerCase() : '';

    let normalized = base
        .toLowerCase()
        .replace(/[\s_-]+/g, ' ')       // normalize separators to spaces
        .replace(/\s*\(\d+\)\s*/g, '')   // remove (1), (2), etc.
        .replace(/\s*copy\s*/gi, '')     // remove "copy"
        .replace(/\s*v\d+\s*/gi, '')     // remove v1, v2, etc.
        .replace(/\s*final\s*/gi, '')    // remove "final"
        .replace(/\s*old\s*/gi, '')      // remove "old"
        .replace(/\s*new\s*/gi, '')      // remove "new"
        .replace(/\s*backup\s*/gi, '')   // remove "backup"
        .replace(/\s*draft\s*/gi, '')    // remove "draft"
        .replace(/\s*edited\s*/gi, '')   // remove "edited"
        .replace(/\s+/g, ' ')           // collapse multiple spaces
        .trim();

    return normalized + ext;
}

/**
 * Check if two strings are very similar (Levenshtein-based).
 */
function similarity(a: string, b: string): number {
    if (a === b) return 1;
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    if (longer.length === 0) return 1;

    // Quick check: if one contains the other
    if (longer.includes(shorter)) return shorter.length / longer.length;

    // Simple character overlap ratio
    const aChars = new Set(a.split(''));
    const bChars = new Set(b.split(''));
    let overlap = 0;
    aChars.forEach(c => { if (bChars.has(c)) overlap++; });
    return overlap / Math.max(aChars.size, bChars.size);
}

/**
 * Detect duplicate files locally — instant, no API call.
 */
function detectDuplicates(files: DuplicateDetectorProps['files']): DuplicateGroup[] {
    // Only check non-folder files
    const realFiles = files.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');
    if (realFiles.length < 2) return [];

    const groups: Map<string, DuplicateGroup> = new Map();
    const assigned = new Set<string>();

    for (let i = 0; i < realFiles.length; i++) {
        if (assigned.has(realFiles[i].id)) continue;

        const normI = normalizeName(realFiles[i].name);
        const matches: typeof realFiles = [realFiles[i]];

        for (let j = i + 1; j < realFiles.length; j++) {
            if (assigned.has(realFiles[j].id)) continue;

            const normJ = normalizeName(realFiles[j].name);

            // Match if: exact normalized name match, or very high similarity
            const isMatch =
                normI === normJ ||
                similarity(normI, normJ) > 0.85 ||
                // Same name (case-insensitive)
                realFiles[i].name.toLowerCase() === realFiles[j].name.toLowerCase() ||
                // Same size + same type (likely identical)
                (realFiles[i].size && realFiles[j].size &&
                    realFiles[i].size === realFiles[j].size &&
                    realFiles[i].mimeType === realFiles[j].mimeType &&
                    similarity(normI, normJ) > 0.6);

            if (isMatch) {
                matches.push(realFiles[j]);
                assigned.add(realFiles[j].id);
            }
        }

        if (matches.length >= 2) {
            assigned.add(realFiles[i].id);
            const ext = realFiles[i].name.split('.').pop()?.toUpperCase() || 'FILE';
            groups.set(normI, {
                group: `Similar ${ext} files: ${realFiles[i].name.slice(0, 30)}...`,
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
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DuplicateDetector({ files, onDeleteFile }: DuplicateDetectorProps) {
    const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
    const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
    const [dismissed, setDismissed] = useState(false);

    // Run detection instantly whenever files change
    useEffect(() => {
        const results = detectDuplicates(files);
        setDuplicates(results);
        setDismissed(false);
    }, [files]);

    if (dismissed) return null;

    const realFileCount = files.filter(f => f.mimeType !== 'application/vnd.google-apps.folder').length;
    if (realFileCount < 2) return null;

    // No duplicates
    if (duplicates.length === 0) return null;

    return (
        <div className="mb-6 animate-slide-up">
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                            <AlertTriangle size={16} />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-tight flex items-center gap-2">
                                {duplicates.length} Duplicate Group{duplicates.length > 1 ? 's' : ''} Detected
                                <Zap size={10} className="text-amber-400/50" />
                            </h4>
                            <p className="text-[9px] font-bold text-amber-400/50 uppercase tracking-widest">
                                {duplicates.reduce((sum, g) => sum + g.files.length, 0)} files could be merged — save storage space
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setDismissed(true)} className="text-amber-400/40 hover:text-amber-400 p-1">
                        <X size={14} />
                    </button>
                </div>

                <div className="divide-y divide-amber-500/10">
                    {duplicates.map((group, i) => (
                        <div key={i} className="px-5">
                            <button
                                onClick={() => setExpandedGroup(expandedGroup === i ? null : i)}
                                className="w-full flex items-center justify-between py-4 text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <Copy size={14} className="text-amber-400/60" />
                                    <span className="text-[10px] font-black text-iron uppercase tracking-tight group-hover:text-amber-400 transition-colors">
                                        {group.group}
                                    </span>
                                    <span className="text-[9px] font-black text-storm-gray bg-shark/60 px-2 py-0.5 rounded-full">
                                        {group.files.length} files
                                    </span>
                                </div>
                                {expandedGroup === i ? (
                                    <ChevronUp size={14} className="text-storm-gray" />
                                ) : (
                                    <ChevronDown size={14} className="text-storm-gray" />
                                )}
                            </button>

                            {expandedGroup === i && (
                                <div className="pb-4 pl-8 space-y-2 animate-slide-up">
                                    {group.files.map((file, j) => (
                                        <div key={j} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-[#09090B]/40 border border-shark/30">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-[10px] font-bold text-iron truncate max-w-[250px]">{file.name}</span>
                                                <span className="text-[9px] text-storm-gray font-bold shrink-0">{formatSize(file.size)}</span>
                                            </div>
                                            {onDeleteFile && (
                                                <button
                                                    onClick={() => onDeleteFile(file.id, false)}
                                                    className="p-1.5 rounded-lg text-storm-gray hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0"
                                                    title="Delete this duplicate"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <p className="text-[9px] font-bold text-amber-400/60 italic mt-2 pl-1 uppercase tracking-widest">
                                        ⚡ {group.reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
