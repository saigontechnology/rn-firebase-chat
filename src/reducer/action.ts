import type { ConversationProps } from '../interfaces';

export enum ChatActionKind {
  SET_LIST_CONVERSATION = 'SET_LIST_CONVERSATION',
  SET_CONVERSATION = 'SET_CONVERSATION',
  UPDATE_CONVERSATION = 'UPDATE_CONVERSATION',
  REMOVE_CONVERSATION = 'REMOVE_CONVERSATION',
}

export const setListConversation = (payload: ConversationProps[]) => ({
  type: ChatActionKind.SET_LIST_CONVERSATION,
  payload,
});

export const setConversation = (payload: ConversationProps) => ({
  type: ChatActionKind.SET_CONVERSATION,
  payload,
});

export const updateConversation = (payload: ConversationProps) => ({
  type: ChatActionKind.UPDATE_CONVERSATION,
  payload,
});

export const removeConversation = (payload: string) => ({
  type: ChatActionKind.REMOVE_CONVERSATION,
  payload,
});
