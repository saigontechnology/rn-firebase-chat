import type { ChatState } from './chat';

export const getListConversation = (state: ChatState) => state.listConversation;

export const getConversation = (state: ChatState) => state.conversation;
