import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { useColorScheme, View } from 'react-native';
import { lightTheme, darkTheme } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import 'react-native-get-random-values';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <PaperProvider theme={colorScheme === 'dark' ? darkTheme : lightTheme}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </PaperProvider>
  );
}
