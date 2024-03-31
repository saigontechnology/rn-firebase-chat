import type { ConversationProps } from '../interfaces';

export enum ChatActionKind {
  SET_LIST_CONVERSATION = 'SET_LIST_CONVERSATION',
  SET_CONVERSATION = 'SET_CONVERSATION',
}

export const setListConversation = (payload: ConversationProps[]) => ({
  type: ChatActionKind.SET_LIST_CONVERSATION,
  payload,
});

export const setConversation = (payload: ConversationProps) => ({
  type: ChatActionKind.SET_CONVERSATION,
  payload,
});
