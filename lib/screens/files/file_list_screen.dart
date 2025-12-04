import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/file_provider.dart';
import '../../widgets/file_item.dart';
import '../../widgets/folder_item.dart';
import 'file_preview_screen.dart';

class FileListScreen extends StatefulWidget {
  const FileListScreen({super.key});

  @override
  State<FileListScreen> createState() => _FileListScreenState();
}

class _FileListScreenState extends State<FileListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FileProvider>().loadFiles();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<FileProvider>(
      builder: (context, fileProvider, _) {
        if (fileProvider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (fileProvider.files.isEmpty && fileProvider.folders.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.folder_open,
                  size: 64,
                  color: Colors.grey[400],
                ),
                const SizedBox(height: 16),
                Text(
                  'No files yet',
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 8),
                Text(
                  'Tap + to upload files or create folders',
                  style: TextStyle(color: Colors.grey[500], fontSize: 12),
                ),
              ],
            ),
          );
        }

        return Column(
          children: [
            if (fileProvider.currentFolderId != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: () => fileProvider.navigateBack(),
                    ),
                    const Text('Back'),
                  ],
                ),
              ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () => fileProvider.loadFiles(folderId: fileProvider.currentFolderId),
                child: CustomScrollView(
                  slivers: [
              if (fileProvider.folders.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Text(
                      'Folders',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                ),
              if (fileProvider.folders.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  sliver: fileProvider.isGridView
                      ? SliverGrid(
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 1.2,
                            crossAxisSpacing: 8,
                            mainAxisSpacing: 8,
                          ),
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final folder = fileProvider.folders[index];
                              return FolderItem(
                                folder: folder,
                                onTap: () {
                                  fileProvider.navigateToFolder(folder.id);
                                },
                              );
                            },
                            childCount: fileProvider.folders.length,
                          ),
                        )
                      : SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final folder = fileProvider.folders[index];
                              return FolderItem(
                                folder: folder,
                                onTap: () {
                                  fileProvider.navigateToFolder(folder.id);
                                },
                              );
                            },
                            childCount: fileProvider.folders.length,
                          ),
                        ),
                ),
              if (fileProvider.files.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Files',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        IconButton(
                          icon: Icon(
                            fileProvider.isGridView
                                ? Icons.view_list
                                : Icons.grid_view,
                          ),
                          onPressed: () => fileProvider.toggleView(),
                        ),
                      ],
                    ),
                  ),
                ),
              if (fileProvider.files.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  sliver: fileProvider.isGridView
                      ? SliverGrid(
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.8,
                            crossAxisSpacing: 8,
                            mainAxisSpacing: 8,
                          ),
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final file = fileProvider.files[index];
                              return FileItem(
                                file: file,
                                isListView: false,
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
                            childCount: fileProvider.files.length,
                          ),
                        )
                      : SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final file = fileProvider.files[index];
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
                            childCount: fileProvider.files.length,
                          ),
                        ),
                ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

