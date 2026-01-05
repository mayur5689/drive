import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { List, IconButton } from 'react-native-paper';
import { Folder } from '../types';
import { useFileStore } from '../store/fileStore';

interface FolderItemProps {
  folder: Folder;
}

export default function FolderItem({ folder }: FolderItemProps) {
  const navigateToFolder = useFileStore((state) => state.navigateToFolder);

  return (
    <TouchableOpacity onPress={() => navigateToFolder(folder.id)}>
      <List.Item
        title={folder.name}
        description={`Folder`}
        left={(props) => <List.Icon {...props} icon="folder" />}
        right={(props) => (
          <IconButton {...props} icon="chevron-right" size={20} />
        )}
      />
    </TouchableOpacity>
  );
}

