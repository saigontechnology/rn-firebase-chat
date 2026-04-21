import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  LogBox,
} from 'react-native';

// Silence Firebase modular deprecation warnings for this example app
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

// iOS UIKit internal warning because new React Native architecture (Fabric/JSI) on iOS
LogBox.ignoreLogs([
  '[UIKitCore] RCTScrollViewComponentView',
]);

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatProvider } from 'rn-firebase-chat';
import auth from '@react-native-firebase/auth';
import { ListChatScreen } from './src/screens/ListChatScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import type { RootStackParamList } from './src/navigation/RouteKey';
import RouteKey from './src/navigation/RouteKey';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [uid, setUid] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [userInfo, setUserInfo] = useState<{
    id: string;
    name: string;
    avatar: string;
  } | null>(null);

  useEffect(() => {
    auth()
      .signInAnonymously()
      .then((credential) => {
        setUid(credential.user.uid);
      })
      .catch((e) => console.error('Auth failed:', e));
  }, []);

  const handleJoin = () => {
    if (!uid) return;
    const name = nameInput.trim() || 'User ' + uid.slice(0, 6);
    setUserInfo({
      id: uid,
      name,
      avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70 + 1),
    });
  };

  if (!uid) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View style={styles.center}>
        <Text style={styles.label}>Enter your display name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Alice"
          value={nameInput}
          onChangeText={setNameInput}
          autoCapitalize="words"
        />
        <TouchableOpacity style={styles.button} onPress={handleJoin}>
          <Text style={styles.buttonText}>Join</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ChatProvider userInfo={userInfo}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name={RouteKey.ListChatScreen}
            options={{ title: "Chats" }}
          >
            {() => <ListChatScreen currentUserId={userInfo.id} currentUserName={userInfo.name} />}
          </Stack.Screen>
          <Stack.Screen
            name={RouteKey.ChatScreen}
            component={ChatScreen}
            options={({ route }) => ({ title: route.params.name ?? 'Chat' })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ChatProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  label: { fontSize: 16, marginBottom: 12, color: '#333' },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
