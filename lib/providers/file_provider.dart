import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import '../models/file_model.dart';
import '../models/folder_model.dart';
import '../services/file_service.dart';
import '../services/folder_service.dart';

class FileProvider with ChangeNotifier {
  final FileService _fileService = FileService();
  final FolderService _folderService = FolderService();

  List<FileModel> _files = [];
  List<FolderModel> _folders = [];
  String? _currentFolderId;
  bool _isLoading = false;
  bool _isGridView = true;

  List<FileModel> get files => _files;
  List<FolderModel> get folders => _folders;
  String? get currentFolderId => _currentFolderId;
  bool get isLoading => _isLoading;
  bool get isGridView => _isGridView;

  Future<void> loadFiles({String? folderId}) async {
    _isLoading = true;
    notifyListeners();

    try {
      _currentFolderId = folderId;
      _files = await _fileService.getFiles(folderId: folderId);
      _folders = await _folderService.getFolders(parentId: folderId);
    } catch (e) {
      debugPrint('Error loading files: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> pickAndUploadFiles() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
        type: FileType.any,
      );

      if (result != null && result.files.isNotEmpty) {
        for (var platformFile in result.files) {
          try {
            // Check if bytes are available (web) or path is available (mobile)
            if (platformFile.bytes != null) {
              // Web - use PlatformFile directly with bytes
              await _fileService.uploadFile(
                platformFile,
                platformFile.name,
                _currentFolderId,
                null,
              );
            } else if (platformFile.path != null && platformFile.path!.isNotEmpty) {
              // Mobile/Desktop - use File with path
              await _fileService.uploadFile(
                File(platformFile.path!),
                platformFile.name,
                _currentFolderId,
                null,
              );
            } else {
              debugPrint('File has neither bytes nor path: ${platformFile.name}');
            }
          } catch (e) {
            debugPrint('Error uploading file ${platformFile.name}: $e');
            // Continue with next file instead of stopping
          }
        }
        await loadFiles(folderId: _currentFolderId);
      }
    } catch (e) {
      debugPrint('Error in pickAndUploadFiles: $e');
      rethrow;
    }
  }

  Future<void> deleteFile(FileModel file) async {
    try {
      await _fileService.deleteFile(file.id, file.path);
      await loadFiles(folderId: _currentFolderId);
    } catch (e) {
      debugPrint('Error deleting file: $e');
    }
  }

  Future<void> renameFile(FileModel file, String newName) async {
    try {
      await _fileService.renameFile(file.id, newName);
      await loadFiles(folderId: _currentFolderId);
    } catch (e) {
      debugPrint('Error renaming file: $e');
    }
  }

  Future<void> createFolder(String name) async {
    try {
      await _folderService.createFolder(name, parentId: _currentFolderId);
      await loadFiles(folderId: _currentFolderId);
    } catch (e) {
      debugPrint('Error creating folder: $e');
    }
  }

  Future<void> navigateToFolder(String folderId) async {
    await loadFiles(folderId: folderId);
  }

  Future<void> navigateBack() async {
    // TODO: Implement navigation back logic
    await loadFiles(folderId: null);
  }

  void toggleView() {
    _isGridView = !_isGridView;
    notifyListeners();
  }

  Future<List<FileModel>> searchFiles(String query) async {
    return await _fileService.searchFiles(query);
  }
}

