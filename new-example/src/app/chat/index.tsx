import React, { useCallback } from 'react';
import { ListConversationScreen } from 'rn-firebase-chat';
import { useRouter } from 'expo-router';

export default function ListChatScreen() {
  const router = useRouter();

  const handleItemPress = useCallback(
    (data: any) => {
      router.push({
        pathname: '/chat/[conversationId]',
        params: {
          conversationId: data.conversationId,
          partnerIds: JSON.stringify(data.memberIds),
          partners: JSON.stringify(data.partners),
        },
      });
    },
    [router]
  );

  return <ListConversationScreen onPress={handleItemPress} />;
}
