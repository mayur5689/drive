import { View, StyleSheet } from 'react-native';
import { File } from '../types';
import FileItem from './FileItem';

interface FileListProps {
  files: File[];
}

export default function FileList({ files }: FileListProps) {
  return (
    <View style={styles.container}>
      {files.map((file) => (
        <FileItem key={file.id} file={file} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});


