import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FirestoreServices,
  TYPING_EXPIRY_MS,
} from '@saigontechnology/firebase-chat-shared';
import { TypingUser, UseTypingReturn } from '../types';
import { DEFAULT_TYPING_TIMEOUT_SECONDS } from '../utils/constants';

export const useTyping = (
  roomId: string,
  userId: string,
  typingTimeoutSeconds: number = DEFAULT_TYPING_TIMEOUT_SECONDS,
  externalTypingData?: Record<string, number>,
  /** uid → display name, used to resolve typing user names */
  partnerNames?: Record<string, string>
): UseTypingReturn => {
  const service = FirestoreServices.getInstance();

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!externalTypingData) return;
    const now = Date.now();
    const users: TypingUser[] = Object.entries(externalTypingData)
      .filter(
        ([uid, ts]) => uid !== userId && ts > 0 && now - ts < TYPING_EXPIRY_MS
      )
      .map(([uid, ts]) => ({
        uid,
        displayName: partnerNames?.[uid] ?? `User ${uid}`,
        timestamp: ts,
      }));
    setTypingUsers(users);
  }, [externalTypingData, userId, partnerNames]);

  const setTyping = useCallback(
    (isTyping: boolean): void => {
      if (!userId || !roomId) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (isTyping) {
        if (!isTypingRef.current) {
          service.setUserConversationTyping(true);
          isTypingRef.current = true;
        }
        typingTimeoutRef.current = setTimeout(() => {
          service.setUserConversationTyping(false);
          isTypingRef.current = false;
        }, typingTimeoutSeconds);
      } else {
        service.setUserConversationTyping(false);
        isTypingRef.current = false;
      }
    },
    [roomId, userId, typingTimeoutSeconds, service]
  );

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current && roomId && userId) {
        service.setUserConversationTyping(false);
      }
    };
  }, [roomId, userId, service]);

  return { typingUsers, setTyping };
};
