import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/file_model.dart';

class SharingService {
  final SupabaseClient _supabase = Supabase.instance.client;

  Future<void> shareFile(String fileId, String sharedWithEmail, String permission) async {
    // Use Supabase RPC to call the function
    await _supabase.rpc('share_file_by_email', params: {
      'p_file_id': fileId,
      'p_shared_with_email': sharedWithEmail,
      'p_permission': permission,
    });
  }
  
  // Alternative: Share by user ID directly
  Future<void> shareFileByUserId(String fileId, String sharedWithUserId, String permission) async {
    final ownerId = _supabase.auth.currentUser!.id;

    await _supabase.from('shared_files').insert({
      'file_id': fileId,
      'owner_id': ownerId,
      'shared_with_id': sharedWithUserId,
      'permission': permission,
    });
  }

  Future<List<FileModel>> getSharedFiles() async {
    try {
      final userId = _supabase.auth.currentUser!.id;
      
      final response = await _supabase
          .from('shared_files')
          .select('''
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
          ''')
          .eq('shared_with_id', userId);

      if (response == null || response.isEmpty) {
        return [];
      }

      return (response as List)
          .where((item) => item['files'] != null)
          .map((item) => FileModel.fromJson(item['files'] as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('Error getting shared files: $e');
      return [];
    }
  }

  Future<void> unshareFile(String fileId, String sharedWithId) async {
    await _supabase
        .from('shared_files')
        .delete()
        .eq('file_id', fileId)
        .eq('shared_with_id', sharedWithId);
  }
}

