import type { ConversationProps } from './conversation';

export interface IUserInfo {
  id: string;
  name: string;
  avatar: string;
}

export interface IChatContext {
  userInfo: IUserInfo | null;
  listConversation: ConversationProps[] | null;
  enableEncrypt?: boolean;
}
