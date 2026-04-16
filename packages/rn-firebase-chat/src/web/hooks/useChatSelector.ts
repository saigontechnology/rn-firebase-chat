import { useChatContext, ChatContextValue } from '../context/ChatProvider';

/**
 * Custom hook to select a specific part of the chat context.
 * Matching rn-firebase-chat's useChatSelector pattern.
 */
export const useChatSelector = <T>(selector: (context: ChatContextValue) => T): T => {
  const context = useChatContext();
  return selector(context);
};
