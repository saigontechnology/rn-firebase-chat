import type { ConversationProps } from '../types';
import { ChatActionKind } from './action';

export type ChatAction = {
  type: ChatActionKind;
  payload?: ConversationProps[] | ConversationProps;
};

export type ChatState = {
  listConversation?: ConversationProps[];
  conversation?: ConversationProps;
};

export const chatReducer = (
  state: ChatState,
  action: ChatAction
): ChatState => {
  switch (action.type) {
    case ChatActionKind.SET_LIST_CONVERSATION:
      return {
        ...state,
        listConversation: action.payload as ConversationProps[],
      };
    case ChatActionKind.SET_CONVERSATION:
      return {
        ...state,
        conversation: action.payload as ConversationProps,
      };
    case ChatActionKind.CLEAR_CONVERSATION:
      return {
        ...state,
        conversation: undefined,
      };
    case ChatActionKind.UPDATE_CONVERSATION: {
      const updated = action.payload as ConversationProps;
      const isExistID = state.listConversation?.some(
        (item) => item.id === updated.id
      );

      if (!isExistID) {
        return {
          ...state,
          listConversation: [updated, ...(state.listConversation ?? [])],
        };
      }

      const newList = state.listConversation
        ?.map((item) => (item.id === updated.id ? updated : item))
        .sort(
          (a, b) => (b.updatedAt as number) - (a.updatedAt as number)
        );

      return { ...state, listConversation: newList };
    }
    default:
      return state;
  }
};
