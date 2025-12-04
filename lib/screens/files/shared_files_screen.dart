import 'package:flutter/material.dart';
import '../../services/sharing_service.dart';
import '../../models/file_model.dart';
import '../../widgets/file_item.dart';
import 'file_preview_screen.dart';

class SharedFilesScreen extends StatefulWidget {
  const SharedFilesScreen({super.key});

  @override
  State<SharedFilesScreen> createState() => _SharedFilesScreenState();
}

class _SharedFilesScreenState extends State<SharedFilesScreen> {
  final SharingService _sharingService = SharingService();
  List<FileModel> _sharedFiles = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSharedFiles();
  }

  Future<void> _loadSharedFiles() async {
    setState(() => _isLoading = true);
    try {
      _sharedFiles = await _sharingService.getSharedFiles();
    } catch (e) {
      debugPrint('Error loading shared files: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_sharedFiles.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.people_outline,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No shared files',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadSharedFiles,
      child: ListView.builder(
        itemCount: _sharedFiles.length,
        itemBuilder: (context, index) {
          final file = _sharedFiles[index];
          return FileItem(
            file: file,
            isListView: true,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => FilePreviewScreen(file: file),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

