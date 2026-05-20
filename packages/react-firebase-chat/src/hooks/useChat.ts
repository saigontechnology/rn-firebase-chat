import { useState, useEffect, useCallback } from 'react';
import {
  FirestoreServices,
  type MessageProps,
  type ReplyToMessage,
} from '@saigontechnology/firebase-chat-shared';
import { Message, IUser, UseChatReturn, ReplyMessagePreview } from '../types';

const toMessage = (msg: MessageProps): Message => {
  const mediaUrl = msg.path;
  const rawType = msg.type;
  const resolvedType: Message['type'] =
    rawType === 'image'
      ? 'image'
      : rawType === 'video' || rawType === 'voice'
        ? 'file'
        : 'text';

  let metadata: Message['metadata'] | undefined;
  if (resolvedType === 'image' && mediaUrl) {
    metadata = { imageUrl: mediaUrl, fileType: 'image' };
  } else if (resolvedType === 'file' && mediaUrl) {
    metadata = {
      imageUrl: mediaUrl,
      fileName: mediaUrl.split('/').pop(),
      fileType: msg.extension,
    };
  }

  return {
    id: msg.id,
    text: msg.text || '',
    userId: msg.senderId,
    createdAt: typeof msg.createdAt === 'number' ? msg.createdAt : Date.now(),
    type: resolvedType,
    readBy: msg.readBy ?? {},
    isEdited: msg.isEdited,
    replyMessage: msg.replyMessage as ReplyMessagePreview | undefined,
    metadata,
  };
};

export interface UseChatProps {
  user: IUser;
  conversationId?: string;
  memberIds?: string[];
  name?: string;
}

export const useChat = ({
  user,
  conversationId,
}: UseChatProps): UseChatReturn => {
  const service = FirestoreServices.getInstance();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setMessages([]);

    let unsubscribe: (() => void) | undefined;

    service
      .getMessageHistory(50)
      .then((msgs) => {
        // getMessageHistory returns newest-first; reverse to chronological for display
        setMessages(msgs.reverse().map(toMessage));
        setLoading(false);
        // Subscribe for new messages after history is loaded
        unsubscribe = service.receiveMessageListener((msg) => {
          setMessages((prev) => [...prev, toMessage(msg)]);
        });
      })
      .catch((err) => {
        console.error('[useChat] getMessageHistory error:', err);
        setError('Failed to load messages');
        setLoading(false);
      });

    return () => {
      unsubscribe?.();
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (text: string, replyMessage?: ReplyMessagePreview) => {
      try {
        if (!conversationId) throw new Error('No conversation selected');
        // FirestoreServices handles encryption internally
        await service.sendMessage(
          {
            id: '',
            text,
            type: 'text',
            senderId: String(user.id),
            readBy: {},
            createdAt: Date.now(),
          } as MessageProps,
          replyMessage as ReplyToMessage | undefined
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        throw err;
      }
    },
    [conversationId, user.id, service]
  );

  const updateMessage = useCallback(
    async (messageId: string, text: string) => {
      try {
        if (!conversationId) throw new Error('No conversation selected');
        await service.updateMessage({
          id: messageId,
          text,
          senderId: String(user.id),
          readBy: {},
          createdAt: Date.now(),
        } as MessageProps);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update message'
        );
        throw err;
      }
    },
    [conversationId, user.id, service]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        if (!conversationId) throw new Error('No conversation selected');
        await service.deleteMessage(messageId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete message'
        );
        throw err;
      }
    },
    [conversationId, service]
  );

  const markAsRead = useCallback(async () => {
    try {
      if (!conversationId) return;
      await service.changeReadMessage('', String(user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  }, [conversationId, user.id, service]);

  return {
    messages,
    loading,
    error,
    userUnreadMessage: false,
    sendMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
  };
};
