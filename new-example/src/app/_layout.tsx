import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native'
import { Stack } from 'expo-router'
import React from 'react'
import { useColorScheme } from 'react-native'
import { ChatProvider } from 'rn-firebase-chat'

// Replace with your authenticated user info
const userInfo = {
  id: 'user-001',
  name: 'Demo User',
  avatar: 'https://i.pravatar.cc/150?u=user-001',
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  return (
    <ChatProvider userInfo={userInfo}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Conversations' }} />
          <Stack.Screen name="new-chat" options={{ title: 'New Chat' }} />
          <Stack.Screen
            name="chat/[conversationId]"
            options={{ title: 'Chat' }}
          />
        </Stack>
      </ThemeProvider>
    </ChatProvider>
  )
}
