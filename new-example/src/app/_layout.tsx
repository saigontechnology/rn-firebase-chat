import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import React from 'react';
import { useColorScheme } from 'react-native';
import { ChatProvider } from 'rn-firebase-chat';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

// Replace with your authenticated user info
const userInfo = {
  id: 'user-001',
  name: 'Demo User',
  avatar: 'https://i.pravatar.cc/150?u=user-001',
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ChatProvider userInfo={userInfo}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AppTabs />
      </ThemeProvider>
    </ChatProvider>
  );
}
