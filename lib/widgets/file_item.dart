import 'package:flutter/material.dart';
import '../models/file_model.dart';

class FileItem extends StatelessWidget {
  final FileModel file;
  final VoidCallback onTap;
  final bool isListView;

  const FileItem({
    super.key,
    required this.file,
    required this.onTap,
    this.isListView = false,
  });

  IconData _getFileIcon() {
    if (file.isImage) return Icons.image;
    if (file.isVideo) return Icons.video_file;
    if (file.isPdf) return Icons.picture_as_pdf;
    if (file.isText) return Icons.text_snippet;
    return Icons.insert_drive_file;
  }

  @override
  Widget build(BuildContext context) {
    if (isListView) {
      return Card(
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: ListTile(
          leading: Icon(
            _getFileIcon(),
            size: 40,
            color: Theme.of(context).colorScheme.primary,
          ),
          title: Text(
            file.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          subtitle: Text(
            '${file.sizeFormatted} • ${_formatDate(file.createdAt)}',
            style: TextStyle(color: Colors.grey[600], fontSize: 12),
          ),
          trailing: Icon(
            Icons.chevron_right,
            color: Colors.grey[400],
          ),
          onTap: onTap,
        ),
      );
    }

    return Card(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                _getFileIcon(),
                size: 48,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(height: 8),
              Text(
                file.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12),
              ),
              const SizedBox(height: 4),
              Text(
                file.sizeFormatted,
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}

