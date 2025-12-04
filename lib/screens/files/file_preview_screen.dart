import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:open_filex/open_filex.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:provider/provider.dart';
import '../../models/file_model.dart';
import '../../services/file_service.dart';
import '../../services/sharing_service.dart';
import '../../providers/file_provider.dart';

class FilePreviewScreen extends StatefulWidget {
  final FileModel file;

  const FilePreviewScreen({super.key, required this.file});

  @override
  State<FilePreviewScreen> createState() => _FilePreviewScreenState();
}

class _FilePreviewScreenState extends State<FilePreviewScreen> {
  final FileService _fileService = FileService();
  final SharingService _sharingService = SharingService();
  String? _downloadUrl;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadPreview();
  }

  Future<void> _loadPreview() async {
    setState(() => _isLoading = true);
    try {
      _downloadUrl = await _fileService.getDownloadUrl(widget.file.path);
    } catch (e) {
      debugPrint('Error loading preview: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _downloadFile() async {
    try {
      if (_downloadUrl == null) {
        setState(() => _isLoading = true);
        _downloadUrl = await _fileService.getDownloadUrl(widget.file.path);
      }
      
      if (kIsWeb) {
        // Web: Open in new tab (browser will handle download)
        final uri = Uri.parse(_downloadUrl!);
        if (await canLaunchUrl(uri)) {
          await launchUrl(
            uri,
            mode: LaunchMode.externalApplication,
          );
        } else {
          throw Exception('Could not launch URL');
        }
      } else {
        // Mobile/Desktop: Use OpenFilex to open file
        await OpenFilex.open(_downloadUrl!);
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(kIsWeb 
              ? 'File opened in new tab' 
              : 'File opened successfully'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error opening file: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showDeleteDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete File'),
        content: Text('Are you sure you want to delete "${widget.file.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              context.read<FileProvider>().deleteFile(widget.file);
              Navigator.pop(context);
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _showRenameDialog() {
    final nameController = TextEditingController(text: widget.file.name);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Rename File'),
        content: TextField(
          controller: nameController,
          decoration: const InputDecoration(
            labelText: 'File Name',
            border: OutlineInputBorder(),
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              if (nameController.text.isNotEmpty) {
                context.read<FileProvider>().renameFile(
                      widget.file,
                      nameController.text,
                    );
                Navigator.pop(context);
              }
            },
            child: const Text('Rename'),
          ),
        ],
      ),
    );
  }

  void _showShareDialog() {
    final emailController = TextEditingController();
    String selectedPermission = 'view';
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Share File'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: emailController,
                decoration: const InputDecoration(
                  labelText: 'Email Address',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              const Text('Permission:'),
              RadioListTile<String>(
                title: const Text('View'),
                value: 'view',
                groupValue: selectedPermission,
                onChanged: (value) {
                  setState(() => selectedPermission = value!);
                },
              ),
              RadioListTile<String>(
                title: const Text('Edit'),
                value: 'edit',
                groupValue: selectedPermission,
                onChanged: (value) {
                  setState(() => selectedPermission = value!);
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () async {
                if (emailController.text.isNotEmpty) {
                  try {
                    await _sharingService.shareFile(
                      widget.file.id,
                      emailController.text.trim(),
                      selectedPermission,
                    );
                    if (mounted) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('File shared successfully')),
                      );
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error sharing file: $e')),
                      );
                    }
                  }
                }
              },
              child: const Text('Share'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.file.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: _showShareDialog,
          ),
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: _downloadFile,
          ),
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: _showRenameDialog,
          ),
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: _showDeleteDialog,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _buildPreview(),
    );
  }

  Widget _buildPreview() {
    if (widget.file.isImage && _downloadUrl != null) {
      return Center(
        child: InteractiveViewer(
          child: CachedNetworkImage(
            imageUrl: _downloadUrl!,
            placeholder: (context, url) => const CircularProgressIndicator(),
            errorWidget: (context, url, error) => const Icon(Icons.error),
          ),
        ),
      );
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            widget.file.isImage
                ? Icons.image
                : widget.file.isVideo
                    ? Icons.video_file
                    : widget.file.isPdf
                        ? Icons.picture_as_pdf
                        : Icons.insert_drive_file,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            widget.file.name,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            widget.file.sizeFormatted,
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _downloadFile,
            icon: const Icon(Icons.download),
            label: const Text('Download & Open'),
          ),
        ],
      ),
    );
  }
}

