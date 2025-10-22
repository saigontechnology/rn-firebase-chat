import type { ConversationProps } from '../interfaces';
import { ChatActionKind } from './action';

export type ChatAction = {
  type: ChatActionKind;
  payload?: ConversationProps[] | ConversationProps | string;
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
      const message = action.payload as ConversationProps;
      const isExistID = state.listConversation?.some(
        (item) => item.id === message.id
      );

      if (!isExistID) {
        return {
          ...state,
          listConversation: [message, ...(state.listConversation || [])],
        };
      }

      const newListConversation = state.listConversation
        ?.map((item) => (item.id === message.id ? message : item))
        .sort((a, b) => b.updatedAt - a.updatedAt);

      return {
        ...state,
        listConversation: newListConversation,
      };
    }
    case ChatActionKind.DELETE_CONVERSATION: {
      const conversationId = action.payload as string;
      const updatedList = state.listConversation?.filter(
        (item) => item.id !== conversationId
      );

      return {
        ...state,
        listConversation: updatedList,
        conversation:
          state.conversation?.id === conversationId
            ? undefined
            : state.conversation,
      };
    }
  }
};
