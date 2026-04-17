import { useCallback, useRef } from 'react';
import { DEFAULT_TYPING_TIMEOUT_MS } from '../constants';

/**
 * Manages typing indicator state with automatic timeout.
 *
 * @param enableTyping - Whether the typing indicator feature is enabled.
 * @param changeUserConversationTyping - Callback to update typing state upstream (e.g. Firestore).
 * @param typingTimeoutMs - How long after the last keystroke before typing is considered stopped.
 */
export function useTypingIndicator(
  enableTyping: boolean,
  changeUserConversationTyping: (
    isTyping: boolean,
    callback?: () => void
  ) => void,
  typingTimeoutMs: number = DEFAULT_TYPING_TIMEOUT_MS
) {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const isTypingRef = useRef<boolean>(false);

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      changeUserConversationTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      changeUserConversationTyping(false);
    }, typingTimeoutMs);
  }, [changeUserConversationTyping, typingTimeoutMs]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = undefined;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      changeUserConversationTyping(false);
    }
  }, [changeUserConversationTyping]);

  const handleTextChange = useCallback(
    (newText: string) => {
      if (!enableTyping) return;

      if (newText.trim().length > 0) {
        startTyping();
      } else {
        stopTyping();
      }
    },
    [enableTyping, startTyping, stopTyping]
  );

  return { handleTextChange };
}
