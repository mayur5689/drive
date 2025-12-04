import 'package:flutter/material.dart';
import '../models/folder_model.dart';

class FolderItem extends StatelessWidget {
  final FolderModel folder;
  final VoidCallback onTap;

  const FolderItem({
    super.key,
    required this.folder,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.folder,
                size: 64,
                color: Colors.amber[700],
              ),
              const SizedBox(height: 8),
              Text(
                folder.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

