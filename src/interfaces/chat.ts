import type { ChatAction, ChatState } from '../reducer/chat';
import type { Dispatch } from 'react';

export interface IUserInfo {
  id: string;
  name: string;
  memberId: string;
  avatar: string;
}

export interface IChatContext {
  userInfo: IUserInfo | null;
  enableEncrypt?: boolean;
  chatState: ChatState;
  chatDispatch: Dispatch<ChatAction>;
}
