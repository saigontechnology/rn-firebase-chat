import type { ConversationProps } from '../interfaces';
import { ChatActionKind } from './action';

export type ChatAction = {
  type: ChatActionKind;
  payload: ConversationProps[] | ConversationProps;
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
  }
};
