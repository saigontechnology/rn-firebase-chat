import { useCallback, useRef } from 'react';
import { useContext } from 'react';
import { ChatContext } from './chat';
import { FirestoreServices } from './services/firebase';
import type { ChatState } from './reducer';

const useChat = () => {
  const context = useChatContext();
  const firestoreServices = FirestoreServices.getInstance();

  return {
    ...context,
    firestoreServices,
  };
};

const useChatContext = () => {
  return useContext(ChatContext);
};

/**
 * Custom hook to select a specific part of the chat state.
 * @param selector A function that takes the chat state and returns a specific part of it.
 * @returns The part of the chat state selected by the selector function.
 */
const useChatSelector = <T>(selector: (chatState: ChatState) => T): T => {
  const { chatState } = useChatContext();
  return selector(chatState);
};
/**
 * Custom hook to manage typing indicator behavior based on user input.
 * @param enableTyping Boolean flag indicating whether typing indicator should be enabled.
 * @param changeUserConversationTyping Function to update typing indicator state in parent component.
 * @param typingTimeoutSeconds Number of time out.
 */

const useTypingIndicator = (
  enableTyping: boolean,
  changeUserConversationTyping: (
    isTyping: boolean,
    callback?: () => void
  ) => void,
  typingTimeoutSeconds: number = 3000
) => {
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isTypingRef = useRef<boolean>(false);

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      changeUserConversationTyping(true);
    }
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      changeUserConversationTyping(false);
    }, typingTimeoutSeconds);
  }, [changeUserConversationTyping, typingTimeoutSeconds]);

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

  return {
    handleTextChange,
  };
};

export { useChatContext, useChatSelector, useTypingIndicator, useChat };
