import { NextRequest, NextResponse } from 'next/server';
import { askGemini, askGeminiJSON } from '@/lib/gemini';

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

/**
 * Action: search
 * Payload: { query, files: [{id, name, mimeType}, ...] }
 */
async function handleAISearch(payload: any) {
    const { query, files } = payload;
    if (!query || !files?.length) {
        return NextResponse.json({ data: { matchedIds: [] } });
    }
    const prompt = `
You are a file search assistant. The user wants to find files using natural language.

User query: "${query}"
Files: ${JSON.stringify(files.map((f: any) => ({ id: f.id, name: f.name, type: f.mimeType })))}

Return ONLY the IDs of files that match the user's intent. If the user says "images", match image mimeTypes. If the user says "documents", match pdf/doc types. Match by name keywords too.
Return JSON: { "matchedIds": ["id1", "id2"] }
If nothing matches, return: { "matchedIds": [] }
    `;
    const result = await askGeminiJSON(prompt);
    return NextResponse.json(result);
}

/**
 * Action: chat
 * Payload: { message, history: [{role, content}, ...], fileMetadata? }
 */
async function handleAIChat(payload: any) {
    const { message, history, fileMetadata } = payload;
    const historyText = (history || []).slice(-5).map((h: any) => `${h.role}: ${h.content}`).join('\n');
    const prompt = `
You are an AI assistant for a Personal Cloud Storage application called "Drive".
You help users manage their files, understand their storage, and optimize their workflow.

${fileMetadata ? `Context: The user has ${fileMetadata.totalFiles || 'some'} files. ${fileMetadata.summary || ''}` : ''}
${historyText ? `Recent conversation:\n${historyText}` : ''}

User: "${message}"

Respond helpfully and concisely in 1-3 sentences. Be friendly and professional. Do not use markdown formatting.
    `;
    const result = await askGemini(prompt);
    if (result.error) {
        return NextResponse.json({ text: `Sorry, I encountered an issue: ${result.error}` });
    }
    return NextResponse.json({ text: result.text || "I'm here to help with your cloud storage!" });
}

/**
 * Action: tag
 * Payload: { fileName, mimeType }
 */
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
    const result = await askGeminiJSON(prompt);
    return NextResponse.json(result);
}

/**
 * Action: summarize
 * Payload: { fileName, mimeType, description? }
 */
async function handleAISummary(payload: any) {
    const { fileName, mimeType, description } = payload;
    const prompt = `
File: "${fileName}" (type: ${mimeType || 'unknown'})
${description ? `Description: "${description}"` : ''}

Based on the file name and type, write a brief 1-sentence summary of what this file likely contains or is used for.
Return JSON: { "summary": "..." }
    `;
    const result = await askGeminiJSON(prompt);
    return NextResponse.json(result);
}

/**
 * Action: insights
 * Payload: { fileStats: { totalFiles, totalSize, typeCounts } }
 */
async function handleAIInsights(payload: any) {
    const { fileStats } = payload;
    if (!fileStats || fileStats.totalFiles === 0) {
        return NextResponse.json({ data: { insights: ['Upload some files to get AI-powered storage insights!'] } });
    }
    const prompt = `
You are a storage optimization expert. Analyze these drive statistics and give exactly 2 short, actionable tips.

Stats: ${JSON.stringify(fileStats)}

Tips should be specific and helpful (e.g. "You have 15 images — consider creating an Images folder" or "Your root folder has many files, try organizing by project").
Keep each tip under 20 words.
Return JSON: { "insights": ["tip1", "tip2"] }
    `;
    const result = await askGeminiJSON(prompt);
    return NextResponse.json(result);
}

/**
 * Action: duplicates
 * Payload: { files: [{id, name, mimeType, size}, ...] }
 * Detects potential duplicate or very similar files and suggests merging.
 */
async function handleDuplicateDetection(payload: any) {
    const { files } = payload;
    if (!files || files.length < 2) {
        return NextResponse.json({ data: { duplicates: [], hasDuplicates: false } });
    }
    const prompt = `
You are a file deduplication assistant. Analyze these files and find potential duplicates or very similar files.

Files: ${JSON.stringify(files.map((f: any) => ({ id: f.id, name: f.name, type: f.mimeType, size: f.size })))}

Look for:
1. Files with exact same names
2. Files with very similar names (e.g. "report.pdf" and "report (1).pdf" or "report_final.pdf" and "report_final_v2.pdf")
3. Files that appear to be different versions of the same thing (e.g. "logo.png" and "logo_old.png")

Group duplicates together. For each group, suggest which file to keep (usually the newest or the one without copy markers like "(1)").

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
    const result = await askGeminiJSON(prompt);
    return NextResponse.json(result);
}
