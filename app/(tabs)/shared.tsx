import { useEffect } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useFileStore } from '../../store/fileStore';
import { useAuthStore } from '../../store/authStore';
import FileList from '../../components/FileList';
import FileGrid from '../../components/FileGrid';

export default function SharedFilesScreen() {
  const {
    sharedFiles,
    isLoading,
    isGridView,
    loadSharedFiles,
    toggleView,
  } = useFileStore();
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    // Only load shared files if authenticated
    if (isAuthenticated && !isLoadingAuth) {
      loadSharedFiles();
    }
  }, [isAuthenticated, isLoadingAuth]);

  const handleRefresh = () => {
    loadSharedFiles();
  };

  if (sharedFiles.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="headlineMedium" style={styles.emptyText}>
          No shared files
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtext}>
          Files shared with you will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {isGridView ? (
          <FileGrid files={sharedFiles} />
        ) : (
          <FileList files={sharedFiles} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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

