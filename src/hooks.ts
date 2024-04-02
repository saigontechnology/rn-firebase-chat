import { useContext } from 'react';
import { ChatContext } from './chat';
import type { ChatState } from './reducer';

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
