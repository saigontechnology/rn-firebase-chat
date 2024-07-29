import { useContext, useRef } from 'react';
import { ChatContext } from './chat';
import type { ChatState } from './reducer';
import { FirestoreServices } from './services/firebase';

const useChat = () => {
  // const firebaseInstant
};

export const useChatContext = () => {
  return useContext(ChatContext);
};

/**
 * Custom hook to select a specific part of the chat state.
 * @param selector A function that takes the chat state and returns a specific part of it.
 * @returns The part of the chat state selected by the selector function.
 */
export const useChatSelector = <T>(
  selector: (chatState: ChatState) => T
): T => {
  const { chatState } = useChatContext();
  return selector(chatState);
};

export const useTap = (
  onSingleTap: () => void,
  onDoubleTap: () => void,
  delay: number = 300
) => {
  const lastTap = useRef<number | null>(null);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const handleTap = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < delay) {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      onDoubleTap();
    } else {
      lastTap.current = now;
      timeout.current = setTimeout(() => {
        onSingleTap();
      }, delay);
    }
  };

  return handleTap;
};

export const useConversation = () => {
  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;

  return {
    deleteConversation: firebaseInstance.deleteConversation,
    leaveConversation: firebaseInstance.leaveConversation,
  };
};
