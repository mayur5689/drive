import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { File } from '../types';
import { formatFileSize, getFileIcon } from '../constants/theme';
import { useRouter } from 'expo-router';

interface FileGridProps {
  files: File[];
}

export default function FileGrid({ files }: FileGridProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {files.map((file) => (
        <TouchableOpacity
          key={file.id}
          onPress={() => router.push(`/file-preview/${file.id}`)}
          style={styles.cardContainer}
        >
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <IconButton
                icon={getFileIcon(file.mime_type)}
                size={48}
                iconColor="#1976d2"
              />
              <Text variant="bodySmall" numberOfLines={2} style={styles.name}>
                {file.name}
              </Text>
              <Text variant="bodySmall" style={styles.size}>
                {formatFileSize(file.size)}
              </Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardContainer: {
    width: '48%',
  },
  card: {
    marginBottom: 8,
  },
  cardContent: {
    alignItems: 'center',
    padding: 8,
  },
  name: {
    textAlign: 'center',
    marginBottom: 4,
  },
  size: {
    opacity: 0.7,
    textAlign: 'center',
  },
});

