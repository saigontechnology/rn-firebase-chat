import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatService } from '../services/chat';
import { TypingUser, UseTypingReturn } from '../types';
import { DEFAULT_TYPING_TIMEOUT_SECONDS } from '../utils/constants';

/**
 * Manages the "I am typing" write side only.
 * Typing state for other users is derived from the conversation document
 * that subscribeToUserConversations already listens to — no extra snapshot needed.
 *
 * @param roomId - conversation ID
 * @param userId - current user ID
 * @param typingTimeoutSeconds - inactivity ms before typing stops
 * @param externalTypingData - typing map from the live conversation document
 */
export const useTyping = (
  roomId: string,
  userId: string,
  typingTimeoutSeconds: number = DEFAULT_TYPING_TIMEOUT_SECONDS,
  externalTypingData?: Record<string, boolean>
): UseTypingReturn => {
  const chatService = ChatService.getInstance();

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Derive typingUsers from the conversation document data passed in from ChatScreen
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!externalTypingData) return;
    const users: TypingUser[] = Object.entries(externalTypingData)
      .filter(([uid, isTyping]) => uid !== userId && isTyping)
      .map(([uid]) => ({ uid, displayName: `User ${uid}`, timestamp: Date.now() }));
    setTypingUsers(users);
  }, [externalTypingData, userId]);

  const setTyping = useCallback((isTyping: boolean): void => {
    if (!userId || !roomId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isTyping) {
      if (!isTypingRef.current) {
        chatService.updateTypingStatus(roomId, userId, true);
        isTypingRef.current = true;
      }
      typingTimeoutRef.current = setTimeout(() => {
        chatService.updateTypingStatus(roomId, userId, false);
        isTypingRef.current = false;
      }, typingTimeoutSeconds);
    } else {
      chatService.updateTypingStatus(roomId, userId, false);
      isTypingRef.current = false;
    }
  }, [roomId, userId, typingTimeoutSeconds, chatService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current && roomId && userId) {
        chatService.updateTypingStatus(roomId, userId, false);
      }
    };
  }, [roomId, userId, chatService]);

  return { typingUsers, setTyping };
};
