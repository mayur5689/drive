import { create } from 'zustand';
import { File, Folder } from '../types';
import * as fileService from '../services/fileService';
import * as folderService from '../services/folderService';

interface FileState {
  files: File[];
  folders: Folder[];
  sharedFiles: File[];
  currentFolderId: string | null;
  folderStack: string[];
  isLoading: boolean;
  isGridView: boolean;
  loadFiles: (folderId?: string | null) => Promise<void>;
  loadFolders: (parentId?: string | null) => Promise<void>;
  loadSharedFiles: () => Promise<void>;
  uploadFile: (file: any, folderId?: string | null) => Promise<void>;
  deleteFile: (fileId: string, path: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  createFolder: (name: string, parentId?: string | null) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  navigateToFolder: (folderId: string) => void;
  navigateBack: () => void;
  toggleView: () => void;
  searchFiles: (query: string) => Promise<File[]>;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  folders: [],
  sharedFiles: [],
  currentFolderId: null,
  folderStack: [],
  isLoading: false,
  isGridView: false,

  loadFiles: async (folderId?: string | null) => {
    set({ isLoading: true });
    try {
      const files = await fileService.getFiles(folderId);
      set({ files, isLoading: false });
    } catch (error: any) {
      // Silently handle "Not authenticated" errors - they're expected before login
      if (error?.message !== 'Not authenticated') {
        console.error('Error loading files:', error);
      }
      set({ files: [], isLoading: false });
    }
  },

  loadFolders: async (parentId?: string | null) => {
    try {
      const folders = await folderService.getFolders(parentId);
      set({ folders });
    } catch (error: any) {
      // Silently handle "Not authenticated" errors - they're expected before login
      if (error?.message !== 'Not authenticated') {
        console.error('Error loading folders:', error);
      }
      set({ folders: [] });
    }
  },

  loadSharedFiles: async () => {
    set({ isLoading: true });
    try {
      const sharedFiles = await fileService.getSharedFiles();
      set({ sharedFiles, isLoading: false });
    } catch (error: any) {
      // Silently handle "Not authenticated" errors - they're expected before login
      if (error?.message !== 'Not authenticated') {
        console.error('Error loading shared files:', error);
      }
      set({ sharedFiles: [], isLoading: false });
    }
  },

  uploadFile: async (file: any, folderId?: string | null) => {
    try {
      await fileService.uploadFile(file, folderId);
      await get().loadFiles(folderId);
      await get().loadFolders(folderId);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  deleteFile: async (fileId: string, path: string) => {
    try {
      await fileService.deleteFile(fileId, path);
      await get().loadFiles(get().currentFolderId);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  renameFile: async (fileId: string, newName: string) => {
    try {
      await fileService.renameFile(fileId, newName);
      await get().loadFiles(get().currentFolderId);
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  },

  createFolder: async (name: string, parentId?: string | null) => {
    try {
      await folderService.createFolder(name, parentId);
      await get().loadFolders(parentId);
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },

  deleteFolder: async (folderId: string) => {
    try {
      await folderService.deleteFolder(folderId);
      await get().loadFolders(get().currentFolderId);
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  },

  navigateToFolder: (folderId: string) => {
    const { currentFolderId, folderStack } = get();
    set({
      currentFolderId: folderId,
      folderStack: currentFolderId ? [...folderStack, currentFolderId] : [folderId],
    });
    get().loadFiles(folderId);
    get().loadFolders(folderId);
  },

  navigateBack: () => {
    const { folderStack } = get();
    if (folderStack.length > 0) {
      const newStack = [...folderStack];
      const parentId = newStack.pop() || null;
      set({
        currentFolderId: parentId,
        folderStack: newStack,
      });
      get().loadFiles(parentId);
      get().loadFolders(parentId);
    } else {
      set({ currentFolderId: null, folderStack: [] });
      get().loadFiles(null);
      get().loadFolders(null);
    }
  },

  toggleView: () => {
    set({ isGridView: !get().isGridView });
  },

  searchFiles: async (query: string) => {
    try {
      return await fileService.searchFiles(query);
    } catch (error) {
      console.error('Error searching files:', error);
      return [];
    }
  },
}));

