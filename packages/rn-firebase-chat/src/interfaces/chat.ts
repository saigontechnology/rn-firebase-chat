import type { ChatAction, ChatState } from '../reducer/chat';
import type { Dispatch } from 'react';
import type { FirestoreProps } from '../services/firebase';
import { ImageProps } from 'react-native';

export type { IUserInfo } from '@saigontechnology/firebase-chat-shared';

export type IChatContext = {
  chatState: ChatState;
  chatDispatch: Dispatch<ChatAction>;
  CustomImageComponent?: React.ComponentType<ImageProps>;
} & FirestoreProps;
