import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976d2',
    secondary: '#03a9f4',
    tertiary: '#00bcd4',
    background: '#f5f5f5',
    surface: '#ffffff',
    error: '#d32f2f',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#2196f3',
    secondary: '#03a9f4',
    tertiary: '#00bcd4',
    background: '#121212',
    surface: '#1e1e1e',
    error: '#f44336',
  },
};

export const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'file-pdf-box';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word-box';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-excel-box';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'file-powerpoint-box';
  if (mimeType.startsWith('text/')) return 'file-document';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'folder-zip';
  return 'file';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};


