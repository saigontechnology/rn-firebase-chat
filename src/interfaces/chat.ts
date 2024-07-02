import type { ChatAction, ChatState } from '../reducer/chat';
import type { Dispatch } from 'react';

export interface IUserInfo {
  id: string;
  name: string;
  avatar: string;
}

export interface IChatContext {
  userInfo: IUserInfo | null;
  enableEncrypt?: boolean;
  prefix?: string;
  chatState: ChatState;
  chatDispatch: Dispatch<ChatAction>;
}
