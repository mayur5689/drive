import { useEffect, useState } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { FAB, Text, IconButton, Portal, Dialog, TextInput, Button } from 'react-native-paper';
import { useFileStore } from '../../store/fileStore';
import { useAuthStore } from '../../store/authStore';
import FileList from '../../components/FileList';
import FileGrid from '../../components/FileGrid';
import FolderItem from '../../components/FolderItem';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

export default function FileListScreen() {
  const {
    files,
    folders,
    currentFolderId,
    isLoading,
    isGridView,
    loadFiles,
    loadFolders,
    uploadFile,
    createFolder,
    navigateBack,
    toggleView,
  } = useFileStore();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);

  const [fabOpen, setFabOpen] = useState(false);
  const [folderDialogVisible, setFolderDialogVisible] = useState(false);
  const [folderName, setFolderName] = useState('');

  useEffect(() => {
    // Only load files if authenticated
    if (isAuthenticated && !isLoadingAuth) {
      loadFiles(currentFolderId);
      loadFolders(currentFolderId);
    }
  }, [currentFolderId, isAuthenticated, isLoadingAuth]);

  const handleRefresh = () => {
    loadFiles(currentFolderId);
    loadFolders(currentFolderId);
  };

  const handleUpload = async () => {
    // Check authentication before opening file picker
    if (!isAuthenticated) {
      alert('Please login to upload files');
      return;
    }

    try {
      console.log('Opening file picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      console.log('File picker result:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('File selected:', result.assets[0].name);
        setFabOpen(false); // Close FAB menu
        
        try {
          await uploadFile(result.assets[0], currentFolderId);
          console.log('File uploaded successfully');
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError);
          alert('Error uploading file: ' + (uploadError?.message || 'Unknown error'));
        }
      } else {
        console.log('File picker canceled');
      }
    } catch (error: any) {
      console.error('Error in handleUpload:', error);
      alert('Error: ' + (error?.message || 'Failed to open file picker'));
    }
  };

  const handleCreateFolder = async () => {
    if (folderName.trim()) {
      await createFolder(folderName.trim(), currentFolderId);
      setFolderName('');
      setFolderDialogVisible(false);
    }
  };

  const renderContent = () => {
    if (files.length === 0 && folders.length === 0 && !isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <Text variant="headlineMedium" style={styles.emptyText}>
            No files yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Tap + to upload files or create folders
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {folders.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Folders
            </Text>
            {isGridView ? (
              <View style={styles.grid}>
                {folders.map((folder) => (
                  <FolderItem key={folder.id} folder={folder} />
                ))}
              </View>
            ) : (
              <View>
                {folders.map((folder) => (
                  <FolderItem key={folder.id} folder={folder} />
                ))}
              </View>
            )}
          </View>
        )}

        {files.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Files
              </Text>
              <IconButton
                icon={isGridView ? 'view-list' : 'view-grid'}
                onPress={toggleView}
              />
            </View>
            {isGridView ? (
              <FileGrid files={files} />
            ) : (
              <FileList files={files} />
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {currentFolderId && (
        <View style={styles.backButton}>
          <IconButton icon="arrow-left" onPress={navigateBack} />
        </View>
      )}

      {renderContent()}

      <Portal>
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'folder-plus',
              label: 'Create Folder',
              onPress: () => setFolderDialogVisible(true),
            },
            {
              icon: 'upload',
              label: 'Upload File',
              onPress: handleUpload,
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
        />
      </Portal>

      <Portal>
        <Dialog
          visible={folderDialogVisible}
          onDismiss={() => setFolderDialogVisible(false)}
        >
          <Dialog.Title>Create Folder</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Folder Name"
              value={folderName}
              onChangeText={setFolderName}
              mode="outlined"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setFolderDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreateFolder}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100, // Push down a bit
  },
  emptyText: {
    marginBottom: 8,
    opacity: 0.7,
  },
  emptySubtext: {
    opacity: 0.5,
    textAlign: 'center',
  },
});
