import type { ChatAction, ChatState } from '../reducer/chat';
import type { Dispatch } from 'react';
import { EncryptionOptions } from './AESCrypto';

export interface IUserInfo {
  id: string;
  name: string;
  avatar: string;
}

export interface IChatContext {
  userInfo: IUserInfo | null;
  enableEncrypt?: boolean;
  blackListWords?: string[] | null;
  encryptionOptions?: EncryptionOptions | null;
  encryptKey?: string;
  chatState: ChatState;
  chatDispatch: Dispatch<ChatAction>;
}
