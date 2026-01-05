import { supabase } from '../config/supabase';
import { Folder } from '../types';

export const getFolders = async (parentId?: string | null): Promise<Folder[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return []; // Return empty array instead of throwing

  let query = supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (parentId) {
    query = query.eq('parent_id', parentId);
  } else {
    query = query.is('parent_id', null);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as Folder[];
};

export const createFolder = async (
  name: string,
  parentId?: string | null
): Promise<Folder> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('folders')
    .insert({
      user_id: user.id,
      name,
      parent_id: parentId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Folder;
};

export const deleteFolder = async (folderId: string): Promise<void> => {
  const { error } = await supabase.from('folders').delete().eq('id', folderId);
  if (error) throw error;
};

export const moveFileToFolder = async (
  fileId: string,
  folderId: string | null
): Promise<void> => {
  const { error } = await supabase
    .from('files')
    .update({ folder_id: folderId })
    .eq('id', fileId);

  if (error) throw error;
};

