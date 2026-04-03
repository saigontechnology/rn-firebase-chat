import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  ChatScreen as BaseChatScreen,
  type MessageProps,
} from 'rn-firebase-chat';
import { useCamera } from 'rn-firebase-chat/src/addons/camera';

const CURRENT_USER_ID = 'user-001';

/**
 * Small helper rendered inside BaseChatScreen's children render prop.
 * It auto-sends the firstMessage once, then does nothing.
 */
function AutoSendFirstMessage({
  firstMessage,
  onSend,
}: {
  firstMessage: string;
  onSend: (msg: MessageProps) => Promise<void>;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (firstMessage && !sent.current) {
      sent.current = true;
      const msg: MessageProps = {
        _id: `${Date.now()}`,
        id: `${Date.now()}`,
        text: firstMessage,
        createdAt: Date.now(),
        senderId: CURRENT_USER_ID,
        readBy: { [CURRENT_USER_ID]: true },
        user: { _id: CURRENT_USER_ID },
      };
      onSend(msg);
    }
  }, [firstMessage, onSend]);

  return null;
}

export default function ChatDetailScreen() {
  const { members, partners, firstMessage } = useLocalSearchParams<{
    conversationId: string;
    members: string;
    partners?: string;
    firstMessage?: string;
  }>();

  const parsedMembers: string[] = members ? JSON.parse(members) : [];
  const parsedPartners = partners ? JSON.parse(partners) : [];

  const { onPressCamera, onPressGallery } = useCamera();

  return (
    <BaseChatScreen
      memberIds={parsedMembers}
      partners={parsedPartners}
      inputToolbarProps={{
        hasCamera: true,
        hasGallery: true,
        onPressCamera,
        onPressGallery,
      }}
    >
      {({ onSend }) => (
        <AutoSendFirstMessage
          firstMessage={firstMessage ?? ''}
          onSend={onSend}
        />
      )}
    </BaseChatScreen>
  );
}
