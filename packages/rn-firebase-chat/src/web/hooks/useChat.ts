import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatService } from '../services/chat';
import {
  Message,
  IMessage,
  IUser,
  UseChatReturn,
  MediaType,
  ReplyMessagePreview,
} from '../types';
import { useChatContext } from '../context/ChatProvider';
import { encryptData, decryptedMessageData } from '../utils/encryption';

export interface UseChatProps {
  user: IUser;
  conversationId?: string;
  memberIds?: string[];
  name?: string;
}

const convertMessages = async (
  rawMessages: IMessage[],
  key: string | null
): Promise<Message[]> =>
  Promise.all(
    rawMessages.map(async (msg) => {
      // sendMessageWithFile writes `type` + `path`; older paths used msg.image/video/audio.
      const mediaUrl = msg.path || msg.image || msg.video || msg.audio;
      const rawType = msg.type;
      const resolvedType: Message['type'] = msg.system
        ? 'system'
        : rawType === 'image' || msg.image
          ? 'image'
          : rawType === 'video' ||
              rawType === 'voice' ||
              rawType === 'file' ||
              msg.video ||
              msg.audio
            ? 'file'
            : 'text';

      let metadata: Message['metadata'] | undefined;
      if (resolvedType === 'image' && mediaUrl) {
        metadata = { imageUrl: mediaUrl, fileType: 'image' };
      } else if (resolvedType === 'file' && mediaUrl) {
        metadata = {
          imageUrl: mediaUrl, // reuse so downstream components with legacy check still work
          fileName: mediaUrl.split('/').pop() ?? undefined,
          fileType: msg.extension,
        };
      }

      return {
        id: msg.id,
        text: key
          ? await decryptedMessageData(msg.text || '', key)
          : msg.text || '',
        userId: typeof msg.senderId === 'string' ? msg.senderId : '',
        createdAt: msg.createdAt ? msg.createdAt : Date.now(),
        type: resolvedType,
        readBy: msg.readBy ?? {},
        isEdited: msg.isEdited,
        replyMessage: msg.replyMessage,
        metadata,
      };
    })
  );

export const useChat = ({
  user,
  conversationId,
  memberIds,
  name,
}: UseChatProps): UseChatReturn => {
  const chatService = ChatService.getInstance();
  const { derivedKey, enableEncrypt, encryptionFuncProps } = useChatContext();

  // Keep a ref so callbacks always read the latest key without being in deps
  const derivedKeyRef = useRef(derivedKey);
  useEffect(() => {
    derivedKeyRef.current = derivedKey;
  }, [derivedKey]);

  // Cache raw (encrypted) messages so we can re-decrypt when the key arrives
  const rawMessagesRef = useRef<IMessage[]>([]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine the effective key: null when encryption is disabled
  const effectiveKey = enableEncrypt ? derivedKey : null;

  // Re-decrypt cached messages when derivedKey first resolves
  useEffect(() => {
    if (!effectiveKey || rawMessagesRef.current.length === 0) return;
    convertMessages(rawMessagesRef.current, effectiveKey).then(setMessages);
  }, [effectiveKey]);

  // Message subscription — never torn down unless conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = chatService.subscribeToMessages(
      conversationId,
      async (newMessages) => {
        rawMessagesRef.current = newMessages;
        const key = enableEncrypt ? derivedKeyRef.current : null;
        const converted = await convertMessages(newMessages, key);
        setMessages(converted);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe?.();
    };
  }, [conversationId, chatService, enableEncrypt]);

  // Send a text message
  const sendMessage = useCallback(
    async (text: string, replyMessage?: ReplyMessagePreview) => {
      try {
        if (!conversationId) {
          throw new Error('No conversation selected');
        }

        let encryptedText = text;

        if (enableEncrypt) {
          // Use custom encrypt function if provided (matching rn-firebase-chat)
          if (encryptionFuncProps?.encryptFunctionProp) {
            encryptedText = await encryptionFuncProps.encryptFunctionProp(text);
          } else if (derivedKeyRef.current) {
            encryptedText = await encryptData(text, derivedKeyRef.current);
          }
        }

        const senderId = user?.id?.toString() ?? '';
        const messageData = {
          text: encryptedText,
          type: MediaType.text,
          senderId,
          readBy: { [senderId]: true },
          path: '',
          extension: '',
        };

        await chatService.sendMessage(messageData, replyMessage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        throw err;
      }
    },
    [
      conversationId,
      user?.id,
      user?.name,
      chatService,
      memberIds,
      name,
      enableEncrypt,
      encryptionFuncProps,
    ]
  );

  // Update (edit) a message — sets isEdited flag (matching rn-firebase-chat)
  const updateMessage = useCallback(
    async (messageId: string, text: string) => {
      try {
        if (!conversationId) {
          throw new Error('No conversation selected');
        }

        let encryptedText = text;
        if (enableEncrypt) {
          if (encryptionFuncProps?.encryptFunctionProp) {
            encryptedText = await encryptionFuncProps.encryptFunctionProp(text);
          } else if (derivedKeyRef.current) {
            encryptedText = await encryptData(text, derivedKeyRef.current);
          }
        }

        await chatService.updateMessage({
          id: messageId,
          text: encryptedText,
          createdAt: 0, // unused by updateMessage — only id + text are read
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update message'
        );
        throw err;
      }
    },
    [conversationId, chatService, enableEncrypt, encryptionFuncProps]
  );

  // Delete a message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        if (!conversationId) {
          throw new Error('No conversation selected');
        }
        await chatService.deleteMessage(conversationId, messageId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete message'
        );
        throw err;
      }
    },
    [conversationId, chatService]
  );

  // Mark conversation as read — resets current user's unRead to 0 (matching rn-firebase-chat changeReadMessage)
  const markAsRead = useCallback(async () => {
    try {
      if (!conversationId) return;
      await chatService.updateUnread(conversationId, user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
      throw err;
    }
  }, [conversationId, user.id, chatService]);

  return {
    messages,
    loading,
    error,
    userUnreadMessage: false, // Computed in ChatScreen from conversations state — no extra listener
    sendMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
  };
};
