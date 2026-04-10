import { useContext } from 'react';
import { ChatContext } from './chat';
import { FirestoreServices } from './services/firebase';
import type { ChatState } from './reducer';

// Re-export platform-agnostic hooks from shared
export {
  useTypingIndicator,
  useDebounce,
} from '@saigontechnology/firebase-chat-shared';

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

export { useChatContext, useChatSelector, useChat };
