import { useCallback, useRef } from 'react';
import { useContext } from 'react';
import { ChatContext } from './chat';
import type { ChatState } from './reducer';
import { FirestoreServices } from './services/firebase';

const useChat = () => {
  // const firebaseInstant
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

const useConversation = () => {
  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;

  return { deleteConversation: firebaseInstance.deleteConversation };
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
  typingTimeoutSeconds?: number
) => {
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>();

  const startTyping = useCallback(() => {
    changeUserConversationTyping(true);
    typingTimeoutRef.current = setTimeout(() => {
      changeUserConversationTyping(false);
    }, typingTimeoutSeconds);
  }, [changeUserConversationTyping, typingTimeoutSeconds]);

  const stopTyping = useCallback(() => {
    changeUserConversationTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = undefined;
    }
  }, [changeUserConversationTyping]);

  const handleTextChange = useCallback(
    (newText: string) => {
      if (!enableTyping) return;

      if (newText.trim().length > 0) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(stopTyping, typingTimeoutSeconds);
        startTyping();
        return;
      }
      stopTyping();
    },
    [enableTyping, startTyping, stopTyping, typingTimeoutSeconds]
  );

  return {
    handleTextChange,
  };
};

export { useChatContext, useChatSelector, useTypingIndicator, useConversation };
