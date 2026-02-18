import { getRootFolderId, listFolderContents } from '@/lib/googleDrive';

export interface DriveItem {
    id: string;
    name: string;
    mimeType: string;
    isFolder: boolean;
    size: number | null;
    createdTime?: string;
    webViewLink?: string;
    webContentLink?: string;
    previewUrl?: string | null;
}

/**
 * Fetches the root folder ID and its contents
 */
export async function getRootFilesData() {
    try {
        const rootId = await getRootFolderId();
        const items = await listFolderContents(rootId);

        return {
            rootId,
            items: items.map((item: any) => ({
                id: item.id,
                name: item.name,
                mimeType: item.mimeType,
                isFolder: item.mimeType === 'application/vnd.google-apps.folder',
                size: item.size ? parseInt(item.size) : null,
                createdTime: item.createdTime,
                webViewLink: item.webViewLink,
                webContentLink: item.webContentLink,
                previewUrl: item.thumbnailLink || null // thumbnails are useful for previews
            }))
        };
    } catch (error) {
        console.error('Error fetching root files data:', error);
        return {
            rootId: '',
            items: []
        };
    }
}

/**
 * Fetches contents of a specific folder
 */
export async function getFolderContents(folderId: string) {
    try {
        const items = await listFolderContents(folderId);
        return items.map((item: any) => ({
            id: item.id,
            name: item.name,
            mimeType: item.mimeType,
            isFolder: item.mimeType === 'application/vnd.google-apps.folder',
            size: item.size ? parseInt(item.size) : null,
            createdTime: item.createdTime,
            webViewLink: item.webViewLink,
            webContentLink: item.webContentLink,
            previewUrl: item.thumbnailLink || null
        }));
    } catch (error) {
        console.error(`Error fetching folder contents for ${folderId}:`, error);
        return [];
    }
}
