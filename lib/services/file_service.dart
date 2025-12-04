import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import '../config/supabase_config.dart';
import '../models/file_model.dart';

class FileService {
  final SupabaseClient _supabase = Supabase.instance.client;
  final _uuid = const Uuid();

  Future<List<FileModel>> getFiles({String? folderId}) async {
    try {
      final response = await _supabase
          .from('files')
          .select()
          .eq('user_id', _supabase.auth.currentUser!.id)
          .order('created_at', ascending: false);
      
      if (response == null || response.isEmpty) {
        return [];
      }
      
      final allFiles = (response as List)
          .map((json) => FileModel.fromJson(json as Map<String, dynamic>))
          .toList();
      
      if (folderId != null) {
        return allFiles.where((file) => file.folderId == folderId).toList();
      } else {
        return allFiles.where((file) => file.folderId == null).toList();
      }
    } catch (e) {
      debugPrint('Error getting files: $e');
      return [];
    }
  }

  Future<FileModel> uploadFile(
    dynamic file, // Can be File or PlatformFile
    String fileName,
    String? folderId,
    Function(double)? onProgress,
  ) async {
    final userId = _supabase.auth.currentUser!.id;
    final fileId = _uuid.v4();
    final storagePath = '$userId/$fileId/$fileName';

    // Get file bytes - handle both File and PlatformFile (web)
    Uint8List fileBytes;
    int fileSize;
    
    if (file is File) {
      // Mobile/Desktop - use File
      fileBytes = await file.readAsBytes();
      fileSize = await file.length();
    } else {
      // Web - PlatformFile with bytes property
      final bytes = file.bytes;
      if (bytes == null) {
        throw Exception('File bytes are null. Cannot upload file.');
      }
      fileBytes = Uint8List.fromList(bytes);
      fileSize = file.size;
    }

    // Upload to storage
    await _supabase.storage
        .from(SupabaseConfig.storageBucket)
        .uploadBinary(
          storagePath,
          fileBytes,
          fileOptions: const FileOptions(
            upsert: false,
          ),
        );

    // Save metadata to database
    final fileModel = FileModel(
      id: fileId,
      userId: userId,
      name: fileName,
      path: storagePath,
      size: fileSize,
      mimeType: _getMimeType(fileName),
      folderId: folderId,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    await _supabase.from('files').insert({
      'id': fileId,
      'user_id': userId,
      'name': fileName,
      'path': storagePath,
      'size': fileModel.size,
      'mime_type': fileModel.mimeType,
      'folder_id': folderId,
    });

    return fileModel;
  }

  Future<void> deleteFile(String fileId, String path) async {
    await Future.wait([
      _supabase.from('files').delete().eq('id', fileId) as Future<dynamic>,
      _supabase.storage.from(SupabaseConfig.storageBucket).remove([path]),
    ]);
  }

  Future<void> renameFile(String fileId, String newName) async {
    await _supabase
        .from('files')
        .update({'name': newName, 'updated_at': DateTime.now().toIso8601String()})
        .eq('id', fileId);
  }

  Future<String> getDownloadUrl(String path) async {
    return await _supabase.storage
        .from(SupabaseConfig.storageBucket)
        .createSignedUrl(path, 3600);
  }

  Future<List<FileModel>> searchFiles(String query) async {
    final response = await _supabase
        .from('files')
        .select()
        .eq('user_id', _supabase.auth.currentUser!.id)
        .ilike('name', '%$query%')
        .order('created_at', ascending: false);

    return (response as List)
        .map((json) => FileModel.fromJson(json))
        .toList();
  }

  String _getMimeType(String fileName) {
    final extension = fileName.split('.').last.toLowerCase();
    final mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
    };
    return mimeTypes[extension] ?? 'application/octet-stream';
  }
}

