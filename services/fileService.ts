import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { supabase, STORAGE_BUCKET } from '../config/supabase';
import { File } from '../types';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { v4 as uuidv4 } from 'uuid';

export const getFiles = async (folderId?: string | null): Promise<File[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return []; // Return empty array instead of throwing

  let query = supabase
    .from('files')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (folderId) {
    query = query.eq('folder_id', folderId);
  } else {
    query = query.is('folder_id', null);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as File[];
};

export const uploadFile = async (
  file: DocumentPicker.DocumentPickerAsset,
  folderId?: string | null
): Promise<File> => {
  // Check authentication first
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Upload error - Auth check failed:', authError || 'No user');
    throw new Error('Not authenticated');
  }

  console.log('Upload starting for user:', user.id);

  const fileId = uuidv4();
  const fileName = file.name || 'untitled';
  const storagePath = `${user.id}/${fileId}/${fileName}`;

  let fileBody: any;

  if (Platform.OS === 'web') {
    // On web, we can't use FileSystem.readAsStringAsync reliably for all file types
    // and we should upload the blob/file object directly
    const response = await fetch(file.uri);
    fileBody = await response.blob();
  } else {
    // Read file as base64 on mobile using legacy API
    const fileUri = file.uri;
    console.log('Reading file from URI:', fileUri);
    
    try {
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64' as any,
      });
      const binaryString = atob(base64);
      const fileBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        fileBytes[i] = binaryString.charCodeAt(i);
      }
      fileBody = fileBytes;
      console.log('File read successfully, size:', fileBytes.length);
    } catch (readError) {
      console.error('Error reading file:', readError);
      throw new Error('Failed to read file: ' + (readError as Error).message);
    }
  }

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, fileBody, {
      contentType: file.mimeType || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Save metadata to database
  const fileData: Partial<File> = {
    id: fileId,
    user_id: user.id,
    name: fileName,
    path: storagePath,
    size: file.size || 0,
    mime_type: file.mimeType || getMimeType(fileName),
    folder_id: folderId || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('files')
    .insert(fileData)
    .select()
    .single();

  if (error) throw error;
  return data as File;
};

export const deleteFile = async (fileId: string, path: string): Promise<void> => {
  await Promise.all([
    supabase.from('files').delete().eq('id', fileId),
    supabase.storage.from(STORAGE_BUCKET).remove([path]),
  ]);
};

export const renameFile = async (fileId: string, newName: string): Promise<void> => {
  const { error } = await supabase
    .from('files')
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq('id', fileId);

  if (error) throw error;
};

export const getDownloadUrl = async (path: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 3600);

  if (error) throw error;
  return data.signedUrl;
};

export const searchFiles = async (query: string): Promise<File[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', user.id)
    .ilike('name', `%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as File[];
};

export const getSharedFiles = async (): Promise<File[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return []; // Return empty array instead of throwing

  const { data, error } = await supabase
    .from('shared_files')
    .select(`
      file_id,
      files (
        id,
        user_id,
        name,
        path,
        size,
        mime_type,
        folder_id,
        created_at,
        updated_at
      )
    `)
    .eq('shared_with_id', user.id);

  if (error) throw error;

  return (data || [])
    .filter((item: any) => item.files)
    .map((item: any) => item.files) as File[];
};

const getMimeType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
  };
  return mimeTypes[extension || ''] || 'application/octet-stream';
};

