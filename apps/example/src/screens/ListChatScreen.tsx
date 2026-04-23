import React, { useCallback, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  TextInput,
  Alert,
} from 'react-native';
import {
  ListConversationScreen,
  setConversation,
  useChatContext,
} from 'rn-firebase-chat';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RouteKey';
import RouteKey from '../navigation/RouteKey';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  currentUserId: string;
  currentUserName: string;
}

export const ListChatScreen: React.FC<Props> = ({ currentUserId, currentUserName }) => {
  const navigation = useNavigation<Nav>();
  const { chatDispatch } = useChatContext();
  const [otherUserId, setOtherUserId] = useState('');

  const handleItemPress = useCallback(
    (data: any) => {
      chatDispatch?.(setConversation(data));
      const partnerId: string = data.members?.find((id: string) => id !== currentUserId) ?? '';
      // names map: { [userId]: ownDisplayName } — look up the partner's entry for the title
      const partnerName: string = (partnerId ? data.names?.[partnerId] : undefined) ?? '';
      navigation.navigate(RouteKey.ChatScreen, {
        conversationId: data.id,
        name: partnerName,
        otherUserId: partnerId,
      });
    },
    [navigation, chatDispatch, currentUserId]
  );

  const handleStartChat = useCallback(() => {
    const targetId = otherUserId.trim();
    if (!targetId) {
      Alert.alert('Enter the other user\'s UID first');
      return;
    }
    const conversationId = [currentUserId, targetId].sort().join('_');
    navigation.navigate(RouteKey.ChatScreen, {
      conversationId,
      name: '',          // partner name unknown until they open the conversation
      otherUserId: targetId,
      memberIds: [targetId],
      // Seed only our own name; partner's name is written by their setConversationInfo
      names: {
        [currentUserId]: currentUserName,
      },
    });
  }, [otherUserId, currentUserId, currentUserName, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.infoBox}>
        <Text style={styles.label}>Your UID (share with the other device):</Text>
        <Text selectable style={styles.uid}>{currentUserId}</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Paste other user's UID here"
          value={otherUserId}
          onChangeText={setOtherUserId}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleStartChat}>
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>
      </View>

      <ListConversationScreen onPress={handleItemPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  infoBox: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    margin: 12,
    borderRadius: 8,
  },
  label: { fontSize: 12, color: '#666', marginBottom: 4 },
  uid: { fontSize: 13, fontFamily: 'monospace', color: '#333' },
  inputRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
