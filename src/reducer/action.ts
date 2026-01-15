import type { ConversationProps } from '../interfaces';

export enum ChatActionKind {
  SET_LIST_CONVERSATION = 'SET_LIST_CONVERSATION',
  SET_CONVERSATION = 'SET_CONVERSATION',
  CLEAR_CONVERSATION = 'CLEAR_CONVERSATION',
  UPDATE_CONVERSATION = 'UPDATE_CONVERSATION',
  DELETE_CONVERSATION = 'DELETE_CONVERSATION',
}

export const setListConversation = (payload: ConversationProps[]) => ({
  type: ChatActionKind.SET_LIST_CONVERSATION,
  payload,
});

export const setConversation = (payload: ConversationProps) => ({
  type: ChatActionKind.SET_CONVERSATION,
  payload,
});

export const clearConversation = () => ({
  type: ChatActionKind.CLEAR_CONVERSATION,
});

export const updateConversation = (payload: ConversationProps) => ({
  type: ChatActionKind.UPDATE_CONVERSATION,
  payload,
});

export const deleteConversation = (payload: string) => ({
  type: ChatActionKind.DELETE_CONVERSATION,
  payload,
});
