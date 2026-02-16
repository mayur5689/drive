import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

// ─── Auth (OAuth2 — uses your Google account's storage quota) ───
function getAuth() {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Google OAuth2 credentials are not set. Required: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN');
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    return oauth2Client;
}

function getDrive(): drive_v3.Drive {
    return google.drive({ version: 'v3', auth: getAuth() });
}

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '';

// ─── Folder Operations ───

/**
 * Find a folder by name inside a parent. Returns its ID or null.
 */
export async function findFolder(parentId: string, folderName: string): Promise<string | null> {
    const drive = getDrive();
    const res = await drive.files.list({
        q: `'${parentId}' in parents and name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
        pageSize: 1,
    });
    return res.data.files?.[0]?.id || null;
}

/**
 * Create a folder inside a parent. Returns its ID.
 */
export async function createFolder(parentId: string, folderName: string): Promise<string> {
    const drive = getDrive();
    const res = await drive.files.create({
        requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        },
        fields: 'id',
    });
    return res.data.id!;
}

/**
 * Get or create a folder. Returns its ID.
 */
export async function getOrCreateFolder(parentId: string, folderName: string): Promise<string> {
    const existing = await findFolder(parentId, folderName);
    if (existing) return existing;
    return createFolder(parentId, folderName);
}

/**
 * Build the full folder path: Root > ClientName > RequestTitle > production|distributed
 * Returns the target folder ID.
 */
export async function ensureFolderPath(
    clientName: string,
    requestTitle: string,
    folder: 'production' | 'distributed'
): Promise<string> {
    const clientFolderId = await getOrCreateFolder(ROOT_FOLDER_ID, clientName);
    const requestFolderId = await getOrCreateFolder(clientFolderId, requestTitle);
    const targetFolderId = await getOrCreateFolder(requestFolderId, folder);
    return targetFolderId;
}

// ─── File Operations ───

/**
 * Upload a file to a specific Drive folder. Returns { fileId, webViewLink }.
 */
export async function uploadFileToDrive(
    folderId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string
): Promise<{ fileId: string; webViewLink: string }> {
    const drive = getDrive();

    const res = await drive.files.create({
        requestBody: {
            name: fileName,
            parents: [folderId],
        },
        media: {
            mimeType,
            body: Readable.from(fileBuffer),
        },
        fields: 'id, webViewLink',
    });

    const fileId = res.data.id!;

    // Make the file publicly viewable via link
    await drive.permissions.create({
        fileId,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    });

    // Get the direct download/view URL
    const fileInfo = await drive.files.get({
        fileId,
        fields: 'webViewLink, webContentLink',
    });

    return {
        fileId,
        webViewLink: fileInfo.data.webContentLink || fileInfo.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    };
}

/**
 * Rename a file in Google Drive.
 */
export async function renameFileInDrive(fileId: string, newName: string): Promise<void> {
    const drive = getDrive();
    await drive.files.update({
        fileId,
        requestBody: { name: newName },
    });
}

/**
 * Delete a file from Google Drive.
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
    const drive = getDrive();
    await drive.files.delete({ fileId });
}

/**
 * List all files in a folder.
 */
export async function listFilesInFolder(folderId: string): Promise<drive_v3.Schema$File[]> {
    const drive = getDrive();
    const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
        fields: 'files(id, name, mimeType, size, createdTime, webViewLink, webContentLink)',
        pageSize: 1000,
    });
    return res.data.files || [];
}

/**
 * Get the root folder ID.
 */
export function getRootFolderId(): string {
    if (!ROOT_FOLDER_ID) throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID is not set');
    return ROOT_FOLDER_ID;
}
