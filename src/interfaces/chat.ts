import type { ChatAction, ChatState } from '../reducer/chat';
import type { Dispatch } from 'react';
import type { FirestoreProps } from '../services/firebase';
import { ImageProps } from 'react-native';

export interface IUserInfo {
  id: string;
  name: string;
  avatar: string;
}
export type IChatContext = {
  chatState: ChatState;
  chatDispatch: Dispatch<ChatAction>;
  CustomImageComponent?: React.ComponentType<ImageProps>;
} & FirestoreProps
