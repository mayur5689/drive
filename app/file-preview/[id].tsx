import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Platform, Alert, Image } from 'react-native';
import { Text, Button, IconButton, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFileStore } from '../../store/fileStore';
import { getDownloadUrl } from '../../services/fileService';
import { formatFileSize, getFileIcon } from '../../constants/theme';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export default function FilePreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { files, sharedFiles } = useFileStore();
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    const foundFile = [...files, ...sharedFiles].find((f) => f.id === id);
    if (foundFile) {
      setFile(foundFile);
      // Load image preview if it's an image
      if (foundFile.mime_type && foundFile.mime_type.startsWith('image/')) {
        loadImagePreview(foundFile.path);
      }
    }
    setLoading(false);
  }, [id, files, sharedFiles]);

  const loadImagePreview = async (path: string) => {
    setLoadingImage(true);
    try {
      const url = await getDownloadUrl(path);
      setImageUrl(url);
    } catch (error) {
      console.error('Error loading image preview:', error);
    } finally {
      setLoadingImage(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    setDownloading(true);
    try {
      console.log('Getting download URL for file:', file.path);
      const url = await getDownloadUrl(file.path);
      console.log('Got signed URL:', url);

      if (Platform.OS === 'web') {
        // On web, just open the URL in a new tab
        await Linking.openURL(url);
        Alert.alert('Download Started', 'File download has started in your browser.');
      } else {
        // On mobile, download to local storage first, then share
        const fileName = file.name || 'download';
        const fileExtension = fileName.split('.').pop() || 'bin';
        const localUri = `${FileSystem.documentDirectory}${file.id}.${fileExtension}`;

        console.log('Downloading file to:', localUri);
        
        const downloadResult = await FileSystem.downloadAsync(url, localUri);
        console.log('File downloaded to:', downloadResult.uri);

        if (downloadResult.status === 200) {
          // Check if sharing is available
          if (await Sharing.isAvailableAsync()) {
            console.log('Sharing file...');
            await Sharing.shareAsync(downloadResult.uri, {
              mimeType: file.mime_type || 'application/octet-stream',
              dialogTitle: `Share ${file.name}`,
            });
            Alert.alert('Success', 'File ready to share!');
          } else {
            // If sharing not available, open the file
            const canOpen = await Linking.canOpenURL(downloadResult.uri);
            if (canOpen) {
              await Linking.openURL(downloadResult.uri);
            } else {
              Alert.alert('Download Complete', `File saved to: ${downloadResult.uri}`);
            }
          }
        } else {
          throw new Error(`Download failed with status: ${downloadResult.status}`);
        }
      }
    } catch (error: any) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', `Failed to download file: ${error?.message || 'Unknown error'}`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!file) {
    return (
      <View style={styles.center}>
        <Text>File not found</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="headlineSmall" style={styles.title}>
          {file.name}
        </Text>
      </View>

      <View style={styles.content}>
        {imageUrl && !loadingImage ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        ) : loadingImage ? (
          <View style={styles.imageContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading preview...</Text>
          </View>
        ) : (
          <View style={styles.iconContainer}>
            <IconButton
              icon={getFileIcon(file.mime_type)}
              size={64}
              iconColor="#1976d2"
            />
          </View>
        )}

        <View style={styles.info}>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Size:
            </Text>
            <Text variant="bodyMedium">{formatFileSize(file.size)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Type:
            </Text>
            <Text variant="bodyMedium">{file.mime_type}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Created:
            </Text>
            <Text variant="bodyMedium">
              {new Date(file.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleDownload}
          loading={downloading}
          disabled={downloading}
          style={styles.button}
          icon="download"
        >
          Download
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  title: {
    flex: 1,
    marginLeft: 8,
  },
  content: {
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  info: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontWeight: 'bold',
  },
  button: {
    marginTop: 16,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
});

