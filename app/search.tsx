import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, List, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFileStore } from '../store/fileStore';
import { File } from '../types';
import FileItem from '../components/FileItem';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<File[]>([]);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const searchFiles = useFileStore((state) => state.searchFiles);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length > 0) {
      setSearching(true);
      const files = await searchFiles(text);
      setResults(files);
      setSearching(false);
    } else {
      setResults([]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <TextInput
          placeholder="Search files..."
          value={query}
          onChangeText={handleSearch}
          mode="outlined"
          style={styles.input}
          autoFocus
          right={
            query.length > 0 && (
              <TextInput.Icon
                icon="close"
                onPress={() => {
                  setQuery('');
                  setResults([]);
                }}
              />
            )
          }
        />
      </View>

      {searching ? (
        <View style={styles.center}>
          <List.Subheader>Searching...</List.Subheader>
        </View>
      ) : results.length > 0 ? (
        <View style={styles.results}>
          <List.Subheader>{results.length} results</List.Subheader>
          {results.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              onPress={() => router.push(`/file-preview/${file.id}`)}
            />
          ))}
        </View>
      ) : query.length > 0 ? (
        <View style={styles.center}>
          <List.Subheader>No results found</List.Subheader>
        </View>
      ) : (
        <View style={styles.center}>
          <List.Subheader>Start typing to search</List.Subheader>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
  },
  results: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

