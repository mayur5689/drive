import { Tabs } from 'expo-router';
import { IconButton } from 'react-native-paper';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export default function TabsLayout() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#1976d2',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Files',
          tabBarLabel: 'My Files',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="folder" size={size} color={color} />
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton
                icon="magnify"
                onPress={() => router.push('/search')}
              />
              <IconButton
                icon="logout"
                onPress={handleLogout}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="shared"
        options={{
          title: 'Shared Files',
          tabBarLabel: 'Shared',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="share-variant" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

