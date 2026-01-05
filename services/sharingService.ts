import { supabase } from '../config/supabase';

export const shareFile = async (
  fileId: string,
  sharedWithEmail: string,
  permission: 'read' | 'write'
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Note: In production, you'd need a backend function to get user by email
  // For now, we'll use a workaround - you'll need to implement this via a Supabase function
  // or use the user's ID directly
  throw new Error('Sharing by email requires a backend function. Use shareFileByUserId instead.');
};

export const shareFileByUserId = async (
  fileId: string,
  sharedWithUserId: string,
  permission: 'read' | 'write'
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('shared_files').insert({
    file_id: fileId,
    owner_id: user.id,
    shared_with_id: sharedWithUserId,
    permission,
  });

  if (error) throw error;
};

export const unshareFile = async (
  fileId: string,
  sharedWithId: string
): Promise<void> => {
  const { error } = await supabase
    .from('shared_files')
    .delete()
    .eq('file_id', fileId)
    .eq('shared_with_id', sharedWithId);

  if (error) throw error;
};

