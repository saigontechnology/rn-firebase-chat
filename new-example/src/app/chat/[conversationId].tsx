import React from 'react';
import { ChatScreen as BaseChatScreen } from 'rn-firebase-chat';
import { useLocalSearchParams } from 'expo-router';

export default function ChatDetailScreen() {
  const { conversationId, partnerIds, partners } = useLocalSearchParams<{
    conversationId: string;
    partnerIds: string;
    partners: string;
  }>();

  const parsedPartnerIds: string[] = partnerIds
    ? JSON.parse(partnerIds)
    : [];
  const parsedPartners = partners ? JSON.parse(partners) : [];

  return (
    <BaseChatScreen
      conversationId={conversationId}
      memberIds={parsedPartnerIds}
      partners={parsedPartners}
    />
  );
}
