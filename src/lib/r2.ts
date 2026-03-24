import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getBucket(): string {
    return process.env.R2_BUCKET_NAME || '';
}

function getR2Client(): S3Client {
    // Always create fresh — env vars may not be set at module load time in serverless
    const accountId = process.env.R2_ACCOUNT_ID || '';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';

    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error('R2 credentials not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in environment.');
    }

    return new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
    });
}

/**
 * Upload a file to R2. Returns the R2 key.
 */
export async function uploadFile(
    userId: string,
    folderPath: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string
): Promise<string> {
    const client = getR2Client();
    const cleanPath = folderPath ? `${folderPath}/` : '';

    // Add UUID to make each upload unique, preventing duplicate key errors
    const uuid = crypto.randomUUID();
    const nameParts = fileName.split('.');
    const ext = nameParts.length > 1 ? nameParts.pop() : '';
    const baseName = nameParts.join('.');
    const uniqueFileName = ext ? `${baseName}-${uuid}.${ext}` : `${fileName}-${uuid}`;

    const key = `users/${userId}/${cleanPath}${uniqueFileName}`;

    await client.send(new PutObjectCommand({
        Bucket: getBucket(),
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
    }));

    return key;
}

/**
 * Delete a single file from R2.
 */
export async function deleteFile(r2Key: string): Promise<void> {
    const client = getR2Client();
    await client.send(new DeleteObjectCommand({
        Bucket: getBucket(),
        Key: r2Key,
    }));
}

/**
 * Delete all objects under a prefix (for folder deletion).
 */
export async function deleteByPrefix(prefix: string): Promise<void> {
    const client = getR2Client();
    const listed = await client.send(new ListObjectsV2Command({
        Bucket: getBucket(),
        Prefix: prefix,
    }));

    if (!listed.Contents || listed.Contents.length === 0) return;

    const objects = listed.Contents.map(obj => ({ Key: obj.Key! }));

    await client.send(new DeleteObjectsCommand({
        Bucket: getBucket(),
        Delete: { Objects: objects },
    }));
}

/**
 * Generate a presigned download URL for a file.
 */
export async function getPresignedUrl(r2Key: string, expiresIn = 3600): Promise<string> {
    const client = getR2Client();
    return getSignedUrl(client, new GetObjectCommand({
        Bucket: getBucket(),
        Key: r2Key,
    }), { expiresIn });
}

/**
 * Get a public URL if R2_PUBLIC_URL is configured, otherwise presigned.
 */
export async function getPublicUrl(r2Key: string): Promise<string> {
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (publicUrl) {
        return `${publicUrl}/${r2Key}`;
    }
    return getPresignedUrl(r2Key);
}

/**
 * Get file content as a readable stream.
 */
export async function getFileStream(r2Key: string) {
    const client = getR2Client();
    const response = await client.send(new GetObjectCommand({
        Bucket: getBucket(),
        Key: r2Key,
    }));
    return {
        stream: response.Body,
        contentType: response.ContentType || 'application/octet-stream',
        contentLength: response.ContentLength,
    };
}
