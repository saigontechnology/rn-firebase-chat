import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import {
  ListConversationScreen,
  type ConversationProps,
} from 'rn-firebase-chat';

// Must match the userInfo.id in _layout.tsx
const CURRENT_USER_ID = 'user-001';

export default function ConversationsScreen() {
  const router = useRouter();

  const handleItemPress = useCallback(
    (conversation: ConversationProps) => {
      // Build partner info from members (excluding current user)
      const partnerIds = conversation.members.filter(
        (id) => id !== CURRENT_USER_ID
      );
      const partners = partnerIds.map((id) => ({
        id,
        name: id, // In a real app, resolve from a user directory
        avatar: `https://i.pravatar.cc/150?u=${id}`,
      }));

      router.push({
        pathname: '/chat/[conversationId]',
        params: {
          conversationId: conversation.id,
          members: JSON.stringify(partnerIds),
          partners: JSON.stringify(partners),
        },
      });
    },
    [router]
  );

  return (
    <View style={styles.container}>
      <ListConversationScreen onPress={handleItemPress} hasSearchBar />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/new-chat')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '300',
  },
});
