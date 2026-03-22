import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/r2';
import { insertFile, updateFileAI } from '@/lib/data/storage';
import { askAIJSON } from '@/lib/ai';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const userId = formData.get('userId') as string;
        const folderId = formData.get('folderId') as string | null;

        if (!file || !userId) {
            return NextResponse.json({ error: 'file and userId required' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const r2Key = await uploadFile(userId, '', file.name, buffer, file.type);

        const fileRecord = await insertFile({
            userId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
            r2Key,
            folderId: folderId || null,
        });

        // Auto-tag in background
        autoTag(fileRecord.id, file.name, file.type).catch(() => {});

        return NextResponse.json({
            id: fileRecord.id,
            url: r2Key,
            name: file.name,
            type: file.type,
        });
    } catch (error: any) {
        console.error('Upload API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function autoTag(fileId: string, fileName: string, mimeType: string) {
    try {
        const prompt = `Analyze this file: "${fileName}" (type: ${mimeType || 'unknown'}). Return JSON: { "category": "one-word", "tags": ["tag1", "tag2"], "summary": "1 sentence" }`;
        const result = await askAIJSON(prompt);
        if (result.data) {
            await updateFileAI(fileId, result.data.tags || [], result.data.category || 'General', result.data.summary);
        }
    } catch {}
}
