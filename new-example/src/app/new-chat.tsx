import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * Example "Start a New Chat" screen.
 *
 * In a real app you'd show a contact list or user search.
 * Here we let the user type a partner's ID, name, and avatar URL
 * to demonstrate how to navigate into ChatScreen with a new partner.
 */
export default function NewChatScreen() {
  const router = useRouter();
  const [partnerId, setPartnerId] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerAvatar, setPartnerAvatar] = useState('');
  const [firstMessage, setFirstMessage] = useState('');

  const handleStartChat = () => {
    const id = partnerId.trim();
    const name = partnerName.trim() || id;

    if (!id) {
      Alert.alert(
        'Partner ID required',
        'Enter the user ID of the person you want to chat with.'
      );
      return;
    }

    if (!firstMessage.trim()) {
      Alert.alert(
        'Message required',
        'Enter a first message to start the conversation.'
      );
      return;
    }

    const partners = [
      {
        id,
        name,
        avatar: partnerAvatar.trim() || `https://i.pravatar.cc/150?u=${id}`,
      },
    ];

    router.replace({
      pathname: '/chat/[conversationId]',
      params: {
        conversationId: 'new',
        members: JSON.stringify([id]),
        partners: JSON.stringify(partners),
        firstMessage: firstMessage.trim(),
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Partner User ID *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. user-002"
        value={partnerId}
        onChangeText={setPartnerId}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Partner Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Jane Doe"
        value={partnerName}
        onChangeText={setPartnerName}
      />

      <Text style={styles.label}>Partner Avatar URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://example.com/avatar.jpg"
        value={partnerAvatar}
        onChangeText={setPartnerAvatar}
        autoCapitalize="none"
        keyboardType="url"
      />

      <Text style={styles.label}>First Message *</Text>
      <TextInput
        style={[styles.input, styles.messageInput]}
        placeholder="Type your first message..."
        value={firstMessage}
        onChangeText={setFirstMessage}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleStartChat}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Start Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  messageInput: {
    height: 80,
    paddingTop: 12,
  },
  button: {
    marginTop: 32,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
