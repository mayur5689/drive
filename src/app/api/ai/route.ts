import { NextRequest, NextResponse } from 'next/server';
import { askAI, askAIJSON } from '@/lib/ai';
import { createFolder, renameItem, toggleStarred, deleteFileRecord, deleteFolderRecord, moveFile } from '@/lib/data/storage';
import { deleteFile } from '@/lib/r2';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, payload } = body;

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 });
        }

        switch (action) {
            case 'search':
                return await handleAISearch(payload);
            case 'chat':
                return await handleAIChat(payload);
            case 'execute':
                return await handleAIAction(payload);
            case 'tag':
                return await handleAITagging(payload);
            case 'summarize':
                return await handleAISummary(payload);
            case 'insights':
                return await handleAIInsights(payload);
            case 'duplicates':
                return await handleDuplicateDetection(payload);
            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
    } catch (error: any) {
        console.error('AI Route Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

async function handleAIChat(payload: any) {
    const { message, history, storageContext, userProfile } = payload;
    const historyText = (history || []).slice(-8).map((h: any) => `${h.role}: ${h.content}`).join('\n');

    const { files = [], folders = [], stats = {} } = storageContext || {};
    const userName = userProfile?.name || 'User';
    const userEmail = userProfile?.email || 'unknown';
    const userId = payload.userId;

    const totalMB = ((stats.totalSize || 0) / 1048576).toFixed(2);
    const typeBreakdown = Object.entries(stats.typeCounts || {})
        .map(([type, count]) => `${count} ${type}`)
        .join(', ');

    const fileList = files.slice(0, 50).map((f: any) =>
        `- "${f.name}" (${f.mime_type}, ${formatSize(f.size)}, folder: ${f.folder_path}, tags: [${(f.tags || []).join(', ')}]${f.is_starred ? ' ★' : ''})`
    ).join('\n');

    const folderList = folders.map((f: any) =>
        `- "${f.name}" (id: ${f.id}, path: ${f.path})`
    ).join('\n');

    // === SERVER-SIDE INTENT DETECTION ===
    // Detect and execute actions BEFORE calling the AI so they reliably happen
    const executedActions: { type: string; result: string }[] = [];
    const msgLower = message.toLowerCase();

    // Helper: find a file or folder by checking if any known name appears in the message
    const findTarget = () => {
        // Check folders first (longer names first to avoid partial matches)
        const sortedFolders = [...folders].sort((a: any, b: any) => b.name.length - a.name.length);
        for (const f of sortedFolders) {
            if (msgLower.includes(f.name.toLowerCase())) {
                return { ...f, itemType: 'folder' };
            }
        }
        // Then files
        const sortedFiles = [...files].sort((a: any, b: any) => b.name.length - a.name.length);
        for (const f of sortedFiles) {
            if (msgLower.includes(f.name.toLowerCase())) {
                return { ...f, itemType: 'file' };
            }
        }
        return null;
    };

    const isCreateFolder = /(?:create|make|add|new)\s+.*folder/i.test(message);
    const isDelete = /(?:delete|remove|trash|erase)/i.test(message);
    const isRename = /rename/i.test(message);
    const isStar = /\b(?:star|favorite|bookmark)\b/i.test(message) && !/\bunstar|unfavorite|unbookmark\b/i.test(message);
    const isUnstar = /\b(?:unstar|unfavorite|unbookmark)\b/i.test(message);

    // === CREATE FOLDER ===
    if (isCreateFolder && userId) {
        // Extract folder name: "create folder called X", "create a folder X", "make folder named X"
        const nameMatch = message.match(/folder\s+(?:called|named|with\s+name)\s+["""]?(.+?)["""]?\s*$/i)
            || message.match(/["""]([^"""]+)["""]/i)
            || message.match(/folder\s+(\S+(?:\s+\S+)*?)\s*$/i);

        if (nameMatch) {
            let folderName = nameMatch[1].trim()
                .replace(/\s*(folder|please|plz|pls)\s*$/i, '') // remove trailing "folder", "please"
                .trim();
            if (folderName) {
                try {
                    await createFolder(userId, folderName, null);
                    executedActions.push({ type: 'create_folder', result: `Created folder "${folderName}"` });
                } catch (err: any) {
                    executedActions.push({ type: 'create_folder', result: `Failed to create folder: ${err.message}` });
                }
            }
        }
    }

    // === DELETE ===
    if (isDelete && !isCreateFolder && userId) {
        const target = findTarget();
        if (target) {
            try {
                if (target.itemType === 'file') {
                    const r2Key = await deleteFileRecord(target.id);
                    if (r2Key) await deleteFile(r2Key).catch(() => {});
                    executedActions.push({ type: 'delete', result: `Deleted file "${target.name}"` });
                } else {
                    const r2Keys = await deleteFolderRecord(target.id);
                    for (const key of r2Keys) await deleteFile(key).catch(() => {});
                    executedActions.push({ type: 'delete', result: `Deleted folder "${target.name}"` });
                }
            } catch (err: any) {
                executedActions.push({ type: 'delete', result: `Failed to delete: ${err.message}` });
            }
        }
    }

    // === RENAME ===
    if (isRename && !isDelete && !isCreateFolder) {
        const renameMatch = message.match(/rename\s+.*?\s+to\s+["""]?(.+?)["""]?\s*$/i);
        const target = findTarget();
        if (target && renameMatch) {
            const newName = renameMatch[1].trim();
            try {
                await renameItem(target.id, newName, target.itemType);
                executedActions.push({ type: 'rename', result: `Renamed "${target.name}" to "${newName}"` });
            } catch (err: any) {
                executedActions.push({ type: 'rename', result: `Failed to rename: ${err.message}` });
            }
        }
    }

    // === STAR / UNSTAR ===
    if ((isStar || isUnstar) && !isDelete && !isCreateFolder && !isRename) {
        const target = findTarget();
        if (target && target.itemType === 'file') {
            const shouldStar = isStar;
            try {
                await toggleStarred(target.id, shouldStar);
                executedActions.push({ type: shouldStar ? 'star' : 'unstar', result: `${shouldStar ? 'Starred' : 'Unstarred'} "${target.name}"` });
            } catch (err: any) {
                executedActions.push({ type: 'star', result: `Failed: ${err.message}` });
            }
        }
    }

    // Build action context for the AI prompt
    const actionContext = executedActions.length > 0
        ? `\n== ACTIONS JUST PERFORMED ==\n${executedActions.map(a => `- ${a.result}`).join('\n')}\nInclude these results naturally in your response.\n`
        : '';

    const prompt = `You are the AI assistant for "AI Cloud Storage" — a personal cloud drive app.

== USER PROFILE ==
Name: ${userName}
Email: ${userEmail}

== USER'S STORAGE ==
Total files: ${stats.totalFiles || 0}
Total size: ${totalMB} MB
File types: ${typeBreakdown || 'none'}

Files:
${fileList || '(no files yet)'}

Folders:
${folderList || '(no folders yet)'}
${actionContext}
${historyText ? `== RECENT CONVERSATION ==\n${historyText}\n` : ''}
== USER MESSAGE ==
"${message}"

Respond naturally and helpfully. Be specific about their actual files, sizes, and storage. If actions were performed above, confirm them naturally. Keep responses concise (2-4 sentences). Do not use markdown formatting.`;

    const result = await askAI(prompt);
    if (result.error) {
        // If AI fails but we did execute actions, still return the action results
        if (executedActions.length > 0) {
            return NextResponse.json({
                text: executedActions.map(a => a.result).join('. ') + '.',
                actions: executedActions,
            });
        }
        return NextResponse.json({ text: `Sorry, I encountered an issue: ${result.error}` });
    }

    return NextResponse.json({
        text: result.text || "I'm here to help with your cloud storage!",
        actions: executedActions.length > 0 ? executedActions : undefined,
    });
}

/**
 * Execute an action requested by the AI or user.
 */
async function handleAIAction(payload: any) {
    const { type, userId, ...params } = payload;

    try {
        switch (type) {
            case 'create_folder': {
                const folder = await createFolder(userId, params.name, params.parentId || null);
                return NextResponse.json({ success: true, message: `Folder "${params.name}" created`, data: folder });
            }
            case 'rename': {
                await renameItem(params.id, params.newName, params.itemType);
                return NextResponse.json({ success: true, message: `Renamed to "${params.newName}"` });
            }
            case 'star':
            case 'unstar': {
                await toggleStarred(params.id, type === 'star');
                return NextResponse.json({ success: true, message: type === 'star' ? 'File starred' : 'File unstarred' });
            }
            case 'delete': {
                if (params.itemType === 'file') {
                    const r2Key = await deleteFileRecord(params.id);
                    if (r2Key) await deleteFile(r2Key).catch(() => {});
                } else {
                    const r2Keys = await deleteFolderRecord(params.id);
                    for (const key of r2Keys) {
                        await deleteFile(key).catch(() => {});
                    }
                }
                return NextResponse.json({ success: true, message: 'Item deleted' });
            }
            case 'move': {
                await moveFile(params.id, params.targetFolderId || null);
                return NextResponse.json({ success: true, message: 'File moved' });
            }
            default:
                return NextResponse.json({ error: `Unknown action type: ${type}` }, { status: 400 });
        }
    } catch (error: any) {
        console.error('AI Action error:', error);
        return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
    }
}

async function handleAISearch(payload: any) {
    const { query, files } = payload;
    if (!query || !files?.length) {
        return NextResponse.json({ data: { matchedIds: [] } });
    }
    const prompt = `
You are a file search assistant. The user wants to find files using natural language.

User query: "${query}"
Files: ${JSON.stringify(files.map((f: any) => ({ id: f.id, name: f.name, type: f.mime_type || f.mimeType, tags: f.tags })))}

Return ONLY the IDs of files that match the user's intent. If the user says "images", match image types. If the user says "documents", match pdf/doc types. Match by name keywords and tags too.
Return JSON: { "matchedIds": ["id1", "id2"] }
If nothing matches, return: { "matchedIds": [] }
    `;
    const result = await askAIJSON(prompt);
    return NextResponse.json(result);
}

async function handleAITagging(payload: any) {
    const { fileName, mimeType } = payload;
    if (!fileName) {
        return NextResponse.json({ data: { category: 'General', tags: ['file'], suggestedFolder: 'General' } });
    }
    const prompt = `
Analyze this file and categorize it:
File Name: "${fileName}"
Mime Type: "${mimeType || 'unknown'}"

Return JSON with:
- "category": a single word category (e.g. "Invoice", "Photo", "Document", "Spreadsheet", "Video", "Design", "Code", "Presentation")
- "tags": array of 2-3 relevant lowercase tags
- "suggestedFolder": a folder name where this file would logically belong

Return JSON: { "category": "...", "tags": ["...", "..."], "suggestedFolder": "..." }
    `;
    const result = await askAIJSON(prompt);
    return NextResponse.json(result);
}

async function handleAISummary(payload: any) {
    const { fileName, mimeType, description } = payload;
    const prompt = `
File: "${fileName}" (type: ${mimeType || 'unknown'})
${description ? `Description: "${description}"` : ''}

Based on the file name and type, write a brief 1-sentence summary of what this file likely contains or is used for.
Return JSON: { "summary": "..." }
    `;
    const result = await askAIJSON(prompt);
    return NextResponse.json(result);
}

async function handleAIInsights(payload: any) {
    const { fileStats } = payload;
    if (!fileStats || fileStats.totalFiles === 0) {
        return NextResponse.json({ data: { insights: ['Upload some files to get AI-powered storage insights!'] } });
    }
    const prompt = `
You are a storage optimization expert. Analyze these storage statistics and give exactly 2 short, actionable tips.

Stats: ${JSON.stringify(fileStats)}

Tips should be specific and helpful (e.g. "You have 15 images — consider creating an Images folder" or "Your storage has many files, try organizing by project").
Keep each tip under 20 words.
Return JSON: { "insights": ["tip1", "tip2"] }
    `;
    const result = await askAIJSON(prompt);
    return NextResponse.json(result);
}

async function handleDuplicateDetection(payload: any) {
    const { files } = payload;
    if (!files || files.length < 2) {
        return NextResponse.json({ data: { duplicates: [], hasDuplicates: false } });
    }
    const prompt = `
You are a file deduplication assistant. Analyze these files and find potential duplicates or very similar files.

Files: ${JSON.stringify(files.map((f: any) => ({ id: f.id, name: f.name, type: f.mime_type || f.mimeType, size: f.size })))}

Look for:
1. Files with exact same names
2. Files with very similar names (e.g. "report.pdf" and "report (1).pdf")
3. Files that appear to be different versions of the same thing

Group duplicates together. For each group, suggest which file to keep.

Return JSON: {
    "hasDuplicates": true/false,
    "duplicates": [
        {
            "group": "descriptive group name",
            "files": [{"id": "...", "name": "..."}],
            "suggestion": "short suggestion on which to keep and why"
        }
    ]
}

If no duplicates found, return: { "hasDuplicates": false, "duplicates": [] }
    `;
    const result = await askAIJSON(prompt);
    return NextResponse.json(result);
}

function formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}
