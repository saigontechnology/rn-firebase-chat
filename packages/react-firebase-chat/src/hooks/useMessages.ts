import { useState, useEffect, useCallback } from 'react';
import {
  FirestoreServices,
  type MessageProps,
} from '@saigontechnology/firebase-chat-shared';
import { Message, UseMessagesReturn } from '../types';

const toMessage = (msg: MessageProps): Message => {
  const mediaUrl = msg.path;
  const rawType = msg.type;
  const resolvedType: Message['type'] =
    rawType === 'image'
      ? 'image'
      : rawType === 'video' || rawType === 'voice'
        ? 'file'
        : 'text';

  return {
    id: msg.id,
    text: msg.text || '',
    userId: msg.senderId,
    createdAt: typeof msg.createdAt === 'number' ? msg.createdAt : Date.now(),
    type: resolvedType,
    readBy: msg.readBy ?? {},
    metadata:
      resolvedType === 'image' && mediaUrl
        ? { imageUrl: mediaUrl, fileType: 'image' }
        : resolvedType === 'file' && mediaUrl
          ? {
              imageUrl: mediaUrl,
              fileName: mediaUrl.split('/').pop(),
              fileType: msg.extension,
            }
          : undefined,
  };
};

export const useMessages = (
  roomId: string,
  initialLimit: number = 50
): UseMessagesReturn => {
  const service = FirestoreServices.getInstance();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    setLoading(true);
    setError(null);
    setMessages([]);
    setHasMore(true);

    let unsubscribe: (() => void) | undefined;

    service
      .getMessageHistory(initialLimit)
      .then((msgs) => {
        const converted = msgs.reverse().map(toMessage);
        setMessages(converted);
        setLoading(false);
        if (converted.length < initialLimit) setHasMore(false);

        unsubscribe = service.receiveMessageListener((msg) => {
          setMessages((prev) => [...prev, toMessage(msg)]);
        });
      })
      .catch(() => {
        setError('Failed to load messages');
        setLoading(false);
      });

    return () => unsubscribe?.();
  }, [roomId, initialLimit]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || loading) return;
    try {
      setLoading(true);
      const older = await service.getMoreMessage(initialLimit);
      if (older.length === 0) {
        setHasMore(false);
        return;
      }
      setMessages((prev) => [...older.reverse().map(toMessage), ...prev]);
      if (older.length < initialLimit) setHasMore(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load more messages'
      );
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, initialLimit, service]);

  return { messages, loading, error, hasMore, loadMore };
};
