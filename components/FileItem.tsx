import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { List, IconButton } from 'react-native-paper';
import { File } from '../types';
import { formatFileSize, getFileIcon } from '../constants/theme';
import { useRouter } from 'expo-router';

interface FileItemProps {
  file: File;
  onPress?: () => void;
}

export default function FileItem({ file, onPress }: FileItemProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/file-preview/${file.id}`);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <List.Item
        title={file.name}
        description={formatFileSize(file.size)}
        left={(props) => (
          <List.Icon {...props} icon={getFileIcon(file.mime_type)} />
        )}
        right={(props) => (
          <IconButton {...props} icon="chevron-right" size={20} />
        )}
      />
    </TouchableOpacity>
  );
}

