import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/folder_model.dart';

class FolderService {
  final SupabaseClient _supabase = Supabase.instance.client;

  Future<List<FolderModel>> getFolders({String? parentId}) async {
    try {
      final response = await _supabase
          .from('folders')
          .select()
          .eq('user_id', _supabase.auth.currentUser!.id)
          .order('created_at', ascending: false);
      
      if (response == null || response.isEmpty) {
        return [];
      }
      
      final allFolders = (response as List)
          .map((json) => FolderModel.fromJson(json as Map<String, dynamic>))
          .toList();
      
      if (parentId != null) {
        return allFolders.where((folder) => folder.parentId == parentId).toList();
      } else {
        return allFolders.where((folder) => folder.parentId == null).toList();
      }
    } catch (e) {
      debugPrint('Error getting folders: $e');
      return [];
    }
  }

  Future<FolderModel> createFolder(String name, {String? parentId}) async {
    try {
      final userId = _supabase.auth.currentUser!.id;
      
      final response = await _supabase.from('folders').insert({
        'user_id': userId,
        'name': name,
        'parent_id': parentId,
      }).select().single();

      return FolderModel.fromJson(response as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error creating folder: $e');
      rethrow;
    }
  }

  Future<void> deleteFolder(String folderId) async {
    await _supabase.from('folders').delete().eq('id', folderId);
  }

  Future<void> moveFileToFolder(String fileId, String? folderId) async {
    await _supabase
        .from('files')
        .update({'folder_id': folderId})
        .eq('id', fileId);
  }
}

