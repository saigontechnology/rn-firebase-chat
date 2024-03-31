import type { ConversationProps } from './conversation';

interface IUserInfo {
  id: string;
  name: string;
  avatar: string;
}

interface IChatContext {
  userInfo: IUserInfo;
  listConversation: ConversationProps[] | null;
}

export { IChatContext, IUserInfo };
